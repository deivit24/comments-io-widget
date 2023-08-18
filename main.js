import './styles.scss'
import * as bootstrap from "bootstrap"
import CommentsApi, {showCodeMessage} from "./api.js";
import Icons from "./icons.js";
import moment from "moment";
import Render from "./render.js";

class CommentWidget {
    constructor(
        apiKey = null,
        storyId = 0,
        position = "bottom-right",
        size = 'md'
    ) {
        this.apiKey = apiKey
        this.storyId = storyId
        this.position = this.getPosition(position);
        this.size = size;
        this.totalComments = 0;
        this.totalReplies = 0;
        this.title = ''
        this.errorMessage = '';
        this.comments = [];
        this.replies = []
        this._loading = false;
        this.pagination = this.defaultPagination()
        this.repliesPagination = this.defaultRepliesPagination()
        this.initializeWidget();
    }

    position = "";
    COMMENTS_URL = 'https://comments-io.onrender.com/'

    defaultPagination() {
        return {
            page: 1,
            perPage: 6,
            orderBy: 'created_date',
            sort: 'desc'
        }
    }

    defaultRepliesPagination() {
        return {
            page: 1,
            perPage: 4,
            orderBy: 'created_date',
            sort: 'asc'
        }
    }

    startLoading(type = 'comments') {
        this._loading = true;
        this.handleLoadingStateChange(type); // Call the method to handle loading state change
    }

    stopLoading(type = 'comments') {
        this._loading = false;
        this.handleLoadingStateChange(type); // Call the method to handle loading state change
    }

    handleLoadingStateChange(type) {
        const spinnerElementMap = {
            comments: '.spinner-container',
            replies: '.reply-spinner-container'
            // Add more types and corresponding selector mappings as needed
        };

        const spinnerContainer = document.querySelector(spinnerElementMap[type]);
        spinnerContainer.style.display = this._loading ? 'flex' : 'none';
    }

    async initializeWidget() {
        await this.getStory();
        await this.initialize();
    }

    getPosition(position) {
        const [vertical, horizontal] = position.split("-");
        return {
            [vertical]: "30px",
            [horizontal]: "30px",
        };
    }

    async initialize() {

        this.widgetContainer = document.createElement("div");
        document.body.append(this.widgetContainer)

        this.createWidgetContent();
        const button = document.querySelector("#messageButton");
        button.style.position = "fixed"
        this.applyPosition(button);

        button.addEventListener("click", async () => {
            await this.reloadComments();
        });

        const submitButton = document.querySelector("#submit");
        const selectElement = document.getElementById("sortSelect");

        // Add an event listener for the "change" event
        selectElement.addEventListener("change", async () => {
            const selectedValue = selectElement.value;
            await this.reloadComments(selectedValue)
        });

        // Add event listner to submit button
        submitButton.addEventListener('click', async () => {
            await this.postComment()
        })

        this.createLogo()

        if (this.errorMessage) {
            this.showError()
        }

    }

    applyPosition(element) {
        Object.keys(this.position).forEach(key => {
            element.style[key] = this.position[key];
        });
    }

    createLogo() {
        const el = document.querySelector('#logo')
        const url = this.COMMENTS_URL;
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.target = '_blank';
        linkElement.appendChild(el.cloneNode(true));
        el.parentNode.replaceChild(linkElement, el);
    }

    async reloadComments(selectedValue = null) {
        this.comments = [];
        this.totalComments = 0;
        this.pagination = this.defaultPagination();

        if (selectedValue) {
            this.pagination.orderBy = selectedValue;
        }

        await this.getComments(this.pagination);
        this.renderComments();
    }

    showError() {
        const toastLiveExample = document.querySelector('#liveToast');
        const toastBody = document.querySelector('.toast-body')
        toastBody.innerHTML = this.errorMessage
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
        toastBootstrap.show();
    }

    renderComments() {
        const comments = document.querySelector('#comments')
        comments.innerHTML = ''
        const commentsHTML = this.comments.map(comment => `
          <div class="comment">
              <div class="avatar">
                  <img src="${comment.avatar}" alt="None">
              </div>
              <div class="comment-details">
                  <div class="d-flex justify-content-between" style="height: 20px;">
                    <h6 class="comment-name" data-comment-name="${comment.id}">${comment.name}</h6>
                    <p class="comment-date small">${moment.utc(comment.createdDate).local().fromNow()}</p>
                  </div>
                  <p class="comment-body" data-comment-body="${comment.id}">${comment.body}</p>
                  <div class="comment-actions">
                      ${Render.replyButton(comment.id, comment.replies)}                                                                        
                      <div>
                         <span class="like-button" data-comment-id="${comment.id}">${Icons.thumbsUp(comment.hasLiked)}</span>
                        <span data-comment-likes-id="${comment.id}" class="small ml-2 pt-2">${comment.totalLikes}</span>
                      </div>
                  </div> 
              </div>
          </div>
        `).join('');

        comments.insertAdjacentHTML('beforeend', commentsHTML);
        const likeButtons = document.querySelectorAll('.like-button');
        const replyButtons = document.querySelectorAll('.reply-button');
        likeButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const commentId = button.getAttribute('data-comment-id');
                await this.likeComment(commentId);
            });
        });
        replyButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const commentId = button.getAttribute('data-reply-id');
                await this.openReplyModal(commentId);
            });
        });

        comments.addEventListener('scroll', async () => {
            // Check if the scroll position is near the bottom
            if (comments.scrollHeight - comments.scrollTop === comments.clientHeight) {
                // Reached the bottom
                await this.getNextComments()
            }
        });
    }

    renderReplies(parentCommentId = null) {
        const replies = document.querySelector('#replyComments')
        replies.innerHTML = ''
        const repliesHTML = this.replies.map(reply => `
          <div class="comment">
              <div class="avatar">
                  <img src="${reply.avatar}" alt="None">
              </div>
              <div class="comment-details">
                  <div class="d-flex justify-content-between" style="height: 20px;">
                    <h6 class="comment-name" data-comment-name="${reply.id}">${reply.name}</h6>
                    <p class="comment-date small">${moment.utc(reply.createdDate).local().fromNow()}</p>
                  </div>
                  <p class="comment-body">${reply.body}</p>
                  ${Render.quickReply(reply.id)}                                                                                  
                  <div class="comment-actions">
                      <button class="btn btn-outline-primary quick-reply-button" data-reply-id="${reply.id}" style="--bs-btn-padding-y: .10rem; --bs-btn-padding-x: .5rem; --bs-btn-font-size: .55rem;">Quick Reply</button>                                                                         
                      <div>
                         <span class="like-button" data-comment-id="${reply.id}">${Icons.thumbsUp(reply.hasLiked)}</span>
                        <span data-comment-likes-id="${reply.id}" class="small ml-2 pt-2">${reply.totalLikes}</span>
                      </div>
                  </div> 
              </div>
          </div>
        `).join('');

        replies.insertAdjacentHTML('beforeend', repliesHTML);
        const likeButtons = document.querySelectorAll('.like-button');
        const quickReplyBtns = document.querySelectorAll('.quick-reply-button')
        likeButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const commentId = button.getAttribute('data-reply-id');
                await this.likeComment(commentId);
            });
        });
        quickReplyBtns.forEach(button => {
            button.addEventListener('click', async () => {
                const commentId = button.getAttribute('data-reply-id');
                const quickReply = document.querySelector(`[data-quick-reply-id="${commentId}"]`);
                quickReply.classList.remove('d-none');
                button.disabled = true;
                this.addReplyListener(button, parentCommentId, commentId)
            });
        });

        replies.addEventListener('scroll', async () => {
            // Check if the scroll position is near the bottom
            if (replies.scrollHeight - replies.scrollTop === replies.clientHeight) {
                // Reached the bottom
                await this.getNextReplies(parentCommentId)
            }
        });

    }

    addReplyListener(element, commentId, replyId) {
        const replyMessage = document.querySelector(`[data-quick-reply-message="${replyId}"]`)
        const replyButton = document.querySelector(`[data-quick-reply-post="${replyId}"]`)

        const replyButtonClickHandler = async () => {
            if (replyMessage.value.length === 0) {
                this.errorMessage = 'Reply message cant be empty';
                this.showError();
                return;
            }
            const data = {
                commentId: commentId,
                replyId: replyId,
                body: replyMessage.value
            };
            await this.postComment(data);
            replyMessage.value = '';

        };
        replyButton.addEventListener('click', replyButtonClickHandler)
    }

    async getComments(pagination) {
        try {
            this.startLoading('comments')
            pagination.api_key = this.apiKey
            const res = (await CommentsApi.getStoryComments(this.storyId, pagination)).data
            this.comments = [...this.comments, ...res.comments];
            this.totalComments = res.total
        } catch (e) {
            console.log(e)
        } finally {
            this.stopLoading('comments')
        }
    }

    async getReplies(commentId, params) {
        try {
            this.startLoading('replies')
            params.api_key = this.apiKey
            const res = (await CommentsApi.getStoryCommentReplies(this.storyId, commentId, params)).data
            this.replies = [...this.replies, ...res.comments]
            this.totalReplies = res.total
        } catch (e) {
            console.error(e)
        } finally {
            this.stopLoading('replies')
        }
    }

    async getNextReplies(commentId) {
        if (this.totalReplies > (this.repliesPagination.page * this.repliesPagination.perPage) && !this._loading) {
            this.repliesPagination.page += 1;
            await this.getReplies(commentId, this.repliesPagination)
            this.renderReplies()
        }
    }

    async getNextComments() {
        if (this.totalComments > (this.pagination.page * this.pagination.perPage) && !this._loading) {
            this.pagination.page += 1;
            await this.getComments(this.pagination)
            this.renderComments()
        }
    }

    async getStory() {
        try {
            const data = {
                api_key: this.apiKey
            };
            const res = (await CommentsApi.getStory(this.storyId, data)).data;
            this.totalComments = res.totalComments
            this.title = res.name
        } catch (e) {
            const {response} = e;
            this.errorMessage = showCodeMessage(response.data, response.status);
        }
    }

    async postComment(data = {}) {
        try {
            if (!data.body) {
                const commentMessage = document.querySelector('#commentMessage')
                data.body = commentMessage.value
            }
            data.storyId = this.storyId
            const res = (await CommentsApi.createComment(this.apiKey, data)).data
            if (!data.commentId) {
                this.comments.unshift(res)
                this.renderComments()
            } else {
                this.replies.unshift(res)
                this.renderReplies(res.commentId)
            }
        } catch (e) {
            const {response} = e;
            this.errorMessage = showCodeMessage(response.data, response.status);
            this.showError()
        }
    }

    async likeComment(commentId) {
        const res = (await CommentsApi.likeComment(this.apiKey, parseInt(commentId))).data
        const isLiked = res.isLiked
        const likedButton = document.querySelector(`[data-comment-id="${commentId}"]`);
        const totalLikesSpan = document.querySelector(`[data-comment-likes-id="${commentId}"]`);
        let totalLikes = parseInt(totalLikesSpan.innerHTML)
        likedButton.innerHTML = Icons.thumbsUp(isLiked)
        totalLikes += isLiked ? 1 : -1;
        totalLikesSpan.innerHTML = totalLikes


    }

    async openReplyModal(commentId) {
        const replyModal = new bootstrap.Modal(document.getElementById('replyModal'));
        const commentNameEl = document.querySelector(`[data-comment-name="${commentId}"]`);
        const commentBodyEl = document.querySelector(`[data-comment-body="${commentId}"]`);
        const replyTitle = document.querySelector('#replyModalLabel')
        const replyText = document.querySelector('.modal-text')
        replyTitle.textContent = `Reply to @${commentNameEl.textContent}`
        replyText.textContent = commentBodyEl.textContent
        replyModal.show()
        this.repliesPagination = this.defaultRepliesPagination()
        const pagination = this.repliesPagination

        this.replies = []
        await this.getReplies(commentId, pagination)
        this.renderReplies(commentId)

        const replyButton = document.querySelector('#replyComment')
        const replyMessage = document.querySelector('#replyMessage')
        const replyButtonClickHandler = async () => {
            if (replyMessage.value.length === 0) {
                this.errorMessage = 'Reply message cant be empty';
                this.showError();
                return;
            }
            const data = {
                commentId: commentId,
                body: replyMessage.value
            };
            await this.postComment(data);
            replyMessage.value = '';

        };
        replyButton.addEventListener('click', replyButtonClickHandler);

        const closeButtons = document.querySelectorAll('.close-reply-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                replyMessage.value = '';
                replyModal.hide();
                replyButton.removeEventListener('click', replyButtonClickHandler);
            });
        });

    }

    createWidgetContent() {
        this.widgetContainer.innerHTML = `
       <button id="messageButton"  class="btn btn-primary btn-${this.size} round " type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">
        ${Icons.comments(this.size)}
        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          ${this.totalComments}
          <span class="visually-hidden">unread messages</span>
        </span>
        </button>

      <div class="offcanvas offcanvas-end" data-bs-backdrop="static" tabindex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel" style="width: 500px">
        <div class="offcanvas-header text-center">
          <h5 class="" id="offcanvasRightLabel">${this.title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <div class="mb-3">
            <textarea
               class="form-control"
               id="commentMessage"
               placeholder="Write a comment..."
               maxlength="200"
               name="commentMessage"
               rows="3"></textarea>
            <div class="d-flex justify-content-end align-items-center">
                <select id="sortSelect" class="form-selects form-select-sm" aria-label="Select Example" style="height: 30px; margin-right: 5px; margin-top: 7px;">
                  <option value="created_date">Most Recent</option>
                  <option value="totalLikes">Most Liked</option>
                </select>
                <button id="submit" class="btn btn-primary round btn-sm mt-2 ml-auto">
                  ${Icons.send()}
                </button>                 
            </div>   
          </div>
          <div id="comments"></div>
          <div class="spinner-container">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
             
          </div>  
          <div class="footer">
          <p class="small">powered by</p>
          <img src=${Icons.commentsLogo()} id="logo" alt="comments.io">
          </div>
        </div>
      </div>
        
      <div class="toast-container position-fixed bottom-0 start-50 translate-middle-x p-3">
        <div id="liveToast" class="toast text-bg-danger" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <strong class="me-auto">Comments Section</strong>
            <small>Just Now</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">
            ${this.errorMessage}
          </div>
        </div>
      </div>
      <div class="modal fade" id="replyModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="replayModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="replyModalLabel">Modal title</h1>
              <button type="button" class="btn-close close-reply-modal"  aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="modal-text"></p>
              <textarea
               class="form-control"
               id="replyMessage"
               placeholder="Write a reply..."
               name="replyMessage"
               rows="3"
               maxlength="200"
               required
            ></textarea>
    
            
            <div id="replyComments" class="mt-3">
              
            </div>
            <div class="reply-spinner-container">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
            
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary close-reply-modal">Nevermind</button>
              <button type="button" class="btn btn-primary" id="replyComment">Reply</button>
            </div>
          </div>
        </div>
      </div>
    `;
    }

}

export function initializeWidget(apiKey, storyId, position, size) {
    return new CommentWidget(apiKey, storyId, position, size);
}

