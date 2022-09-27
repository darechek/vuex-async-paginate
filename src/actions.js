import {
  DATA,
  PER_PAGE,
  TOTAL_ITEMS,
  CURRENT_PAGE,
  SORT_COLUMN,
  SORT_DIRECTION,
  TOTAL_PAGES,
  FILTER,
  ALL_KEYS,
  IS_LOADING,
  META,
  IS_SUCCESS_RESPONSE,
  IS_FAIL_RESPONSE,
  SUCCESS_RESPONSE,
  FAIL_RESPONSE
} from './const';

export const mergeActions = function(keys = ALL_KEYS, actions = {}) {
  const CONST_LOADING = keys[IS_LOADING];
  const CONST_PER_PAGE = keys[PER_PAGE];
  const CONST_CURRENT_PAGE = keys[CURRENT_PAGE];
  const CONST_SORT_COLUMN = keys[SORT_COLUMN];
  const CONST_SORT_DIRECTION = keys[SORT_DIRECTION];
  const CONST_FILTER = keys[FILTER];
  const CONST_META = keys[META];
  const CONST_DATA = keys[DATA];
  const CONST_TOTAL_ITEMS = keys[TOTAL_ITEMS];
  const CONST_TOTAL_PAGES = keys[TOTAL_PAGES];
  const CONST_IS_SUCCESS_RESPONSE = keys[IS_SUCCESS_RESPONSE];
  const CONST_IS_FAIL_RESPONSE = keys[IS_FAIL_RESPONSE];
  const CONST_SUCCESS_RESPONSE = keys[SUCCESS_RESPONSE];
  const CONST_FAIL_RESPONSE = keys[FAIL_RESPONSE];

  return {
    setLoading: ({ commit }, value) => commit(CONST_LOADING, !!value),

    setSuccess: ({ commit }, value) => {
      commit(CONST_SUCCESS_RESPONSE, value);
      commit(CONST_IS_FAIL_RESPONSE, false);
      commit(CONST_IS_SUCCESS_RESPONSE, true);
    },

    setFail: ({ commit }, value) => {
      commit(CONST_FAIL_RESPONSE, value);
      commit(CONST_IS_SUCCESS_RESPONSE, false);
      commit(CONST_IS_FAIL_RESPONSE, true);
    },

    changePerPage: ({ commit, dispatch }, value) => {
      commit(CONST_PER_PAGE, value);
      commit(CONST_CURRENT_PAGE, 1);
      return dispatch('getAsyncData');
    },

    changePage: ({ dispatch }, value) => {
      dispatch('getAsyncData', { [CONST_CURRENT_PAGE]: value });
    },

    changeSort: ({ commit, dispatch }, value) => {
      const { [CONST_SORT_COLUMN]: sort_by, [CONST_SORT_DIRECTION]: sort_direction } = value;
      if (sort_by && sort_direction) {
        commit(CONST_SORT_COLUMN, sort_by);
        commit(CONST_SORT_DIRECTION, sort_direction);

        return dispatch('getAsyncData');
      }
    },

    getAsyncData: ({ dispatch, commit, getters }, value) => {
      return new Promise(resolve => {
        dispatch('setLoading', true);
        const filters = getters[CONST_FILTER];

        const perPage = getters[CONST_PER_PAGE];
        const totalItems = getters[CONST_TOTAL_ITEMS];
        let currentPage = getters[CONST_CURRENT_PAGE];
                
        const pagesCount = Math.ceil(totalItems / perPage);

        if (currentPage > pagesCount && totalItems > 0) {
          currentPage -= 1
        }

        let params = {
          [CONST_CURRENT_PAGE]: currentPage,
          [CONST_PER_PAGE]: getters[CONST_PER_PAGE] || 10,
          [CONST_SORT_DIRECTION]: getters[CONST_SORT_DIRECTION],
          [CONST_SORT_COLUMN]: getters[CONST_SORT_COLUMN],
          ...filters,
          ...value
        };
        
        const request = (params) => {
          dispatch('getData', params)
          .then(res => {
            if(res.meta) {
              if (res.meta.total_pages < res.meta.current_page) {
                params[CONST_CURRENT_PAGE] = res.meta.total_pages;
                request(params);
                return;
              }
            }
            
            const data = res[CONST_DATA] || [];
            const meta = {
              [CONST_CURRENT_PAGE]: 1,
              [CONST_PER_PAGE]: data.length,
              [CONST_TOTAL_ITEMS]: data.length,
              [CONST_TOTAL_PAGES]: 1,

              ...(res[CONST_META] ? res[CONST_META] : {})
            };

            commit(CONST_PER_PAGE, meta[CONST_PER_PAGE]);
            commit(CONST_TOTAL_ITEMS, meta[CONST_TOTAL_ITEMS]);
            commit(CONST_TOTAL_PAGES, meta[CONST_TOTAL_PAGES]);
            commit(CONST_CURRENT_PAGE, meta[CONST_CURRENT_PAGE]);
            commit(CONST_DATA, data);

            dispatch('setSuccess', res);
            resolve(value);
          })
          .catch(e => dispatch('setFail', e))
          .finally(() => dispatch('setLoading', false));
        };

        request(params);
        
      });
    },

    search: ({ dispatch, commit }, value) => {
      commit(CONST_FILTER, value);
      return dispatch('getAsyncData', value);
    },

    getData: () => console.error('Укажите getData в actions'),
    ...actions
  };
};
