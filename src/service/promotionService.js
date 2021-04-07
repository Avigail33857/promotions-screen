import {config} from '../config';
import API from '../api';

const columnsNamesURL = config.columnsNamesURL;

export const promotionService = {
    getPromotionsBySkipAndTake: async (query) => {
       return await API.get(`${query}`);
    },

    create: async (data) => {
        return await API.post(`/`, {data: data});
    },

    delete: async (id) => {
        return await API.delete(`/${id}`);
    },

    update: async (id, data) => {
        return await API.put(`/${id}`, {data})
    },

    getColumnsNames: async () => {
        return await API.get(`/${columnsNamesURL}`);
    }
}
