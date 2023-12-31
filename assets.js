export const styles = `
.round {
	 border-radius: 40%;
}
 .comment {
	 display: flex;
	 margin-bottom: 15px;
}
 .avatar {
	 width: 40px;
	 height: 40px;
	 border-radius: 50%;
	 overflow: hidden;
	 margin-right: 10px;
}
 .avatar img {
	 width: 100%;
	 height: 100%;
	 object-fit: cover;
}
 .comment-details, .modal-text {
	 flex: 1;
	 background-color: #f0f0f0;
	 border-radius: 10px;
	 padding: 10px;
}
 .comment-name {
	 margin: 0;
	 font-weight: bold;
}
 .comment-body {
	 margin: 5px 0;
}
 .comment-actions {
	 display: flex;
	 justify-content: space-between;
}
 .comment-actions svg:hover {
	 cursor: pointer;
	 fill: #007bff;
}
 .quick-reply-icon:hover {
	 cursor: pointer;
	 color: #007bff;
}
 #comments {
	 max-height: calc(100vh - 280px);
	 overflow-y: scroll;
}
 .spinner-container, .reply-spinner-container {
	 justify-content: center;
	 align-items: center;
	 display: none;
}
 #replyComments {
	 max-height: 400px;
	 overflow-y: scroll;
}
 .footer {
	 display: flex;
	 flex-direction: column;
	 justify-content: center;
	 align-items: center;
}
 .footer p {
	 margin-bottom: 0;
	 margin-top: 5px;
	 color: gray;
}
 .footer img {
	 cursor: pointer;
}
 
`