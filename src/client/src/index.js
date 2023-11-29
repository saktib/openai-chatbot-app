// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import FileUpload from './FileUpload';
import Chat from './Chat';

ReactDOM.render(
  <React.StrictMode>
  <FileUpload />
  <Chat />
  </React.StrictMode>,
  document.getElementById('root')
);