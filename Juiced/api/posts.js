const express = require('express');
const postsRouter = express.Router();

const { requireUser } = require('./utils');

const { 
  createPost,
  getAllPosts,
  updatePost,
  getPostById,
} = require('../db');

postsRouter.get('/', async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter(post => {
      // the post is active, doesn't matter who it belongs to
      if (post.active) {
        return true;
      }
    
      // the post is not active, but it belogs to the current user
      if (req.user && post.author.id === req.user.id) {
        return true;
      }
    
      // none of the above are true
      return false;
    });
  
    res.send({
      posts
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.post('/', requireUser, async (req, res, next) => {
  const { title, content = "", tags } = req.body; // Add 'tags' to the destructuring

  const postData = {};

  try {
    postData.authorId = req.user.id;
    postData.title = title;
    postData.content = content;
    postData.tags = tags; // Store tags in the postData

    const post = await createPost(postData);

    if (post) {
      res.send(post);
    } else {
      next({
        name: 'PostCreationError',
        message: 'There was an error creating your post. Please try again.'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags; // No need to split since 'tags' is already an array
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost })
    } else {
      next({
        name: 'UnauthorizedUserError',
        message: 'You cannot update a post that is not yours'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;

  try {
    const postToDelete = await getPostById(postId);

    if (!postToDelete) {
      return next({
        name: 'post error',
        message: 'post not found.'
      });
    }

if (postToDelete.author.id !== req.user.id) {
      return next({
        name: 'UnauthorizedUserError',
        message: 'You cannot delete a post that is not yours.'
      });
    }

    await deletePost(postId);

    res.send({ message: 'Post deleted successfully.' });
  } catch ({ name, message }) {
    next({ name, message });
  }
});


module.exports = postsRouter;