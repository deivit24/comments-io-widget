import Icons from "./icons.js";

const Render = {
    replyButton(commentId, replies) {
        const btnLabel = replies > 0 ? `Replies ${replies}` : 'First Reply'
        return `
        <button
            class="btn btn-outline-primary
            reply-button"
            data-reply-id="${commentId}"
            style="--bs-btn-padding-y: .10rem; --bs-btn-padding-x: .5rem; --bs-btn-font-size: .55rem;"
         >
            ${btnLabel}
        </button> 
        `
    },
    quickReply(replyId) {
        return `
        <div class="input-group has-validation my-2 d-none" data-quick-reply-id="${replyId}">
          <input type="text" class="form-control" data-quick-reply-message="${replyId}" aria-describedby="validationquickReply" required>
          <span class="input-group-text quick-reply-icon" data-quick-reply-post="${replyId}" >${Icons.send()}</span>
        </div>
        `
    }
}

export default Render