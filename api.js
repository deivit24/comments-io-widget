import axios from 'axios';

const codeMessageMap = {
    400: '[400]:Request parameter error',
    401: '[401]:account not logged in',
    403: '[403]:access denied',
    404: '[404]:wrong request path',
    405: '[405]:wrong request method',
    500: '[500]:Server Error',
};


export const showCodeMessage = (error, code) => {
    const message = error.message ? error.message : codeMessageMap[JSON.stringify(code)];
    return message || 'Abnormal network connection, Please try again later!';
};

export const formatJsonToUrlParams = (data) => {
    return typeof data === 'object'
        ? Object.keys(data)
            .map((key) => {
                return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
            })
            .join('&')
        : '';
};

const BASE_PREFIX = 'https://comments-io-api.onrender.com/api';

const axiosInstance = axios.create({
    baseURL: BASE_PREFIX,
    timeout: 1000 * 30,
    headers: {
        'Content-Type': 'application/json',
    },
});


const service = {
    get(url, data) {
        return axiosInstance.get(url, {params: data});
    },

    post(url, data) {
        return axiosInstance.post(url, data);
    },

    patch(url, data) {
        return axiosInstance.patch(url, data);
    },

}

const CommentsApi = {
    getStory: (storyId, data) => service.get(`/stories/${storyId}`, data),
    getStoryComments: (storyId, data) => service.get(`/stories/${storyId}/comments`, data),
    getStoryCommentReplies: (storyId, commentId, data) => service.get(`/stories/${storyId}/comments/${commentId}`, data),
    createComment: (apiKey, data) => service.post(`/comments/?api_key=${apiKey}`, data),
    likeComment: (apiKey, commentId) => service.patch(`/comments/${commentId}/like?api_key=${apiKey}`),
}

export default CommentsApi