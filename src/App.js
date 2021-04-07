import './App.css';
import React, {useState} from 'react';
//import table from "./components/Table"
import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import Table from "./components/Table";

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    title: {
        flexGrow: 1,
    },
}));

function App() {
    const classes = useStyles();
    const [isLoaded, setIsLoaded] = useState(false)
    const loadPromotionsData = () => {
        setIsLoaded(true);
    }

    return (
        <div>
            <AppBar position="static" style={{ background: '#2E3B55' , height: 60}} >
                <Toolbar>
                    <img src="https://www.moonactive.com/wp-content/uploads/2019/09/Gray_logo2.svg" alt="moonActive logo"/>
                    <Typography variant="h6" className={classes.title}>
                    </Typography>
                    <Button onClick={loadPromotionsData} color="inherit">Load Promotions</Button>
                </Toolbar>
            </AppBar>
            <div>
                {isLoaded && <Table/>}
            </div>

        </div>
    );
}

export default App;
