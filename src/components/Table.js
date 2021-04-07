import React, {useState, useReducer, useEffect} from 'react';
import Paper from '@material-ui/core/Paper';
import {VirtualTableState, SelectionState, EditingState, DataTypeProvider,} from '@devexpress/dx-react-grid';
import {
    Grid,
    VirtualTable,
    TableHeaderRow,
    TableSelection,
    TableEditRow,
    TableEditColumn,
} from '@devexpress/dx-react-grid-material-ui';
import Select from '@material-ui/core/Select';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import moment from 'moment';
import {promotionService} from "../service/promotionService";

const VIRTUAL_PAGE_SIZE = 100;
const MAX_ROWS = 20000;
const getRowId = row => row._id;
const buildQueryString = (skip, take) => `?skip=${skip}&take=${take}`;

const initialState = {
    rows: [],
    skip: 0,
    requestedSkip: 0,
    take: VIRTUAL_PAGE_SIZE * 2,
    totalCount: 0,
    loading: false,
    lastQuery: '',
};

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function reducer(state, {type, payload}) {
    switch (type) {
        case 'UPDATE_ROWS':
            return {
                ...state,
                ...payload,
                loading: false,
            };
        case 'START_LOADING':
            return {
                ...state,
                requestedSkip: payload.requestedSkip,
                take: payload.take,
            };
        case 'REQUEST_ERROR':
            return {
                ...state,
                loading: false,
            };
        case 'FETCH_INIT':
            return {
                ...state,
                loading: true,
            };
        case 'UPDATE_QUERY':
            return {
                ...state,
                lastQuery: payload,
            };
        default:
            return state;
    }
}

export default () => {

    const [state, dispatch] = useReducer(reducer, initialState);

    const [columns, setColumns] = useState([{name: 'actions', title: 'Actions'}]);
    const [isColumnsNamesExist, setIsColumnsNamesExist] = useState(false);
    const [selection, setSelection] = useState([]);
    const [editingRowIds, setEditingRowIds] = useState([]);
    const [addedRows] = useState([]);
    const [rowChanges, setRowChanges] = useState({});
    const [dateFormatColumns, setDateFormatColumns] = useState([]);
    const [selectFormatColumns, setSelectFormatColumns] = useState({});
    const [open, setOpen] = React.useState(false);
    const [severity, setSeverity] = React.useState('success');
    const [alertMessage, setAlertMessage] = React.useState('');
    const [tableColumnExtensions] = useState([
        {columnName: 'actions', width: 120}
    ]);
    const editingStateColumnExtensions = [
        {columnName: 'actions', editingEnabled: false},
    ];

    const setAlert = (severity, message) => {
        setSeverity(severity);
        setAlertMessage(message);
        setOpen(true);
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const createRow = (data) => {
        promotionService.create(data).then(() => {
            setAlert("success", "Row added successfully");
        }).catch(e => {
            setAlert("error", "Add row failed")
        });
    }

    const updateRow = (id, data) => {
        const {requestedSkip} = state;
        let isValidDate = true;
        dateFormatColumns.forEach(c => {
            if(data[c] && !moment(new Date(data[c])).isValid()){
                isValidDate = false;
            }
        });
        if(isValidDate){
            promotionService.update(id, data).then(() => {
                setAlert("success", "Row updated successfully");
                let changedRows = rows.map(row => (row._id === id ? {...row, ...data} : row));
                dispatch({
                    type: 'UPDATE_ROWS',
                    payload: {
                        skip: requestedSkip,
                        rows: changedRows,
                    },
                });
            }).catch(e => {
                setAlert("error", "Update row failed")
            });
        } else {
            setAlert("error", "Can't update due to invalid date")
        }
    }

    const deleteRow = (id) => {
        const {requestedSkip} = state;
        promotionService.delete(id).then(() => {
            setAlert("success", "Row deleted successfully");
            let changedRows = rows.filter(row => row._id !== id);
            dispatch({
                type: 'UPDATE_ROWS',
                payload: {
                    skip: requestedSkip,
                    rows: changedRows,
                },
            });
        }).catch(e => {
            setAlert("error", "Delete row failed")
        });
    }

    const commitChanges = ({added, changed, deleted}) => {
        if (added) {
            createRow(added[0]);
        } else {
            if (changed) {
                let id = Object.keys(changed)[0];
                updateRow(id, changed[id]);
            }
            if (deleted) {
                let id = deleted[0];
                deleteRow(id);
            }
        }
    };

    function duplicatePromotion(row) {
        const {_id, ...data} = row;
        createRow(data);
    }

    const onValueChange = (row, event) => {
        if(event.target.value === "Duplicate"){
            duplicatePromotion(row);
        }
    }

    const SelectDataType = (props) => {
        const {row} = props;
        return (
            <Select
                value={''}
                onChange={(e) => onValueChange(row, e)}
                style={{width: '100%'}}>
                <MenuItem value="Duplicate">
                    Duplicate
                </MenuItem>
            </Select>
        );
    }

    const SelectTypeProvider = props => (
        <DataTypeProvider
            // disabled={true}
            formatterComponent={SelectDataType}
            {...props}
        />
    );

    const DateFormatter = ({value}) => {
        return moment(value).format('D/MM/YYYY')
    };

    const DateTypeProvider = props => (
        <DataTypeProvider
            formatterComponent={DateFormatter}
            {...props}
        />
    );

    const SelectEditor = (props) => {
        const {value, onValueChange, column} = props;
        return (
            <Select
                input={<Input/>}
                value={value}
                onChange={event => onValueChange(event.target.value)}
                style={{width: '100%'}}>
                {selectFormatColumns[column.name].map((c) => {return (<MenuItem value={c} >{c}</MenuItem>);})}
            </Select>
        );
    }

    const SelectForEditTypeProvider = props => (
        <DataTypeProvider
            editorComponent={SelectEditor}
            {...props}
        />
    );

    const getRemoteRows = (requestedSkip, take) => {
        dispatch({type: 'START_LOADING', payload: {requestedSkip, take}});
    };

    const loadColumnsNames = () => {
        promotionService.getColumnsNames().then(res => {
            setIsColumnsNamesExist(true);
            let columnsNamesArray = [];
            let dateColumns = [];
            let editBySelectOption = {};
            res.data.columnsNames.forEach(column => {
                columnsNamesArray.push({
                    name: column.name,
                    title: column.title,
                    getCellValue: row => row[column.name]
                });
                if (column.type && column.type === 'date') {
                    dateColumns.push(column.name);
                }
                if (column.options && column.options.length > 0) {
                    editBySelectOption[column.name] = column.options;
                }
            });
            setSelectFormatColumns(editBySelectOption);
            setDateFormatColumns(dateColumns);
            setColumns([...columnsNamesArray, ...columns]);
        }).catch(e => {
            dispatch({type: 'REQUEST_ERROR'});
        })
    };

    const loadData = () => {
        const {
            requestedSkip, take, lastQuery, loading,
        } = state;
        const query = buildQueryString(requestedSkip, take);
        if (query !== lastQuery && !loading) {
            dispatch({type: 'FETCH_INIT'});
            promotionService.getPromotionsBySkipAndTake(query)
                .then((res) => {
                    dispatch({
                        type: 'UPDATE_ROWS',
                        payload: {
                            skip: requestedSkip,
                            rows: res.data.data,
                            totalCount: res.data.newTotalCount,
                        },
                    });
                })
                .catch(() => dispatch({type: 'REQUEST_ERROR'}));
            dispatch({type: 'UPDATE_QUERY', payload: query});
        }
    };

    useEffect(() => {
        if (!isColumnsNamesExist) {
            loadColumnsNames();
        }
        loadData();
    });

    const {
        rows, skip, totalCount, loading,
    } = state;
    return (
        <Paper>
            <Grid
                rows={rows}
                columns={columns}
                getRowId={getRowId}
            >
                <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity={severity}>
                        {alertMessage}
                    </Alert>
                </Snackbar>
                <SelectTypeProvider
                    for={['actions']}
                />
                <DateTypeProvider
                    for={dateFormatColumns}
                />
                <SelectForEditTypeProvider
                    for={Object.keys(selectFormatColumns)}
                />
                <SelectionState
                    selection={selection}
                    onSelectionChange={setSelection}
                />
                <EditingState
                    editingRowIds={editingRowIds}
                    onEditingRowIdsChange={setEditingRowIds}
                    rowChanges={rowChanges}
                    onRowChangesChange={setRowChanges}
                    onCommitChanges={commitChanges}
                    columnExtensions={editingStateColumnExtensions}
                />
                <VirtualTableState
                    loading={loading}
                    totalRowCount={totalCount}
                    pageSize={VIRTUAL_PAGE_SIZE}
                    skip={skip}
                    getRows={getRemoteRows}
                />
                <VirtualTable columnExtensions={tableColumnExtensions}/>
                <TableHeaderRow/>
                <TableSelection
                />
                <TableEditRow/>
                <TableEditColumn
                    showAddCommand={!addedRows.length}
                    showEditCommand
                    showDeleteCommand
                />
            </Grid>
        </Paper>
    );
};
