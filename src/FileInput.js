import React from 'react';
import Dropzone from 'react-dropzone';

export default class FileInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      previewUrl: null
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  handleChange(e) {
    const value = e.target.value;
    this.setState({ text: value, previewUrl: value });
    this.props.handleValChange(value);
  }

  handleDrop(acceptedFiles) {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const url = URL.createObjectURL(file);
    this.setState({ text: url, previewUrl: url });
    this.props.handleValChange(url);
  }

  render() {
    return (
      <div className='input' style={{ flexDirection: 'column', alignItems: 'center' }}>
        <input
          name='file-input'
          value={this.state.text}
          onChange={this.handleChange}
          placeholder='Enter URL or drop an image below'
        />
        <Dropzone onDrop={this.handleDrop} accept={{ 'image/*': [] }} multiple={false}>
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              style={{
                width: '800px',
                maxWidth: '90%',
                padding: '20px',
                border: '2px dashed #aaa',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: isDragActive ? '#444' : '#333',
                color: '#aaa',
                textAlign: 'center',
                fontSize: '16px'
              }}
            >
              <input {...getInputProps()} />
              {isDragActive ? 'Drop image here...' : 'Drag and drop an image here, or click to select one'}
            </div>
          )}
        </Dropzone>
        {this.state.previewUrl && (
          <img
            src={this.state.previewUrl}
            alt='Preview'
            style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', marginTop: '8px' }}
            onError={() => this.setState({ previewUrl: null })}
          />
        )}
      </div>
    );
  }
}