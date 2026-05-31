import React from 'react';
import Output from './Output';
import TextInput from './TextInput';
import FileInput from './FileInput';
import './App.css';
import { hideFileInImage, hideTextInImage, readTextFromImage } from './steganography';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      imagefile: '',
      display: '',
      success: false
    }
    this.hide = this.hide.bind(this);
    this.hidefile = this.hidefile.bind(this);
    this.read = this.read.bind(this);
    this.handleFileInputChange = this.handleFileInputChange.bind(this);
    this.handleTextInputChange = this.handleTextInputChange.bind(this);
  }

  handleFileInputChange(input) {
    this.setState({
      imagefile: input
    })
  }

  handleTextInputChange(input) {
    this.setState({
      text: input
    })
  }

  encode(str) {
    return encodeURIComponent(str);
  }

  async hide() {
    this.setState({
      display: 'Loading...'
    });
    const { success, result, error } = await hideTextInImage(this.state.imagefile, this.state.text);
    this.setState({
      display: success ? result : error,
      success: success
    });
  }

  async hidefile() {
    this.setState({
      display: 'Loading...'
    });
    const { success, result, error } = await hideFileInImage(this.state.imagefile, this.state.text);
    this.setState({
      display: success ? result : error,
      success: success
    });
  }

  async read() {
    this.setState({
      display: 'Loading...'
    });
    const { success, message, error } = await readTextFromImage(this.state.imagefile);
    this.setState({
      display: success ? message : error,
      success: success
    });
  }

  render() {
    return (
      <div className="App">
      <header className="App-header">
      <br/><br/>
      <h1>Steganography</h1>
      <p id='top'>Enter the URL of an image file:</p>
      <FileInput id='imagefile' handleValChange={this.handleFileInputChange}/>
      <p>To hide text, enter the text below. To hide the contents of a text file, enter the file URL.
      To read the hidden message in a file, leave this field blank.</p>
      <TextInput id='text' handleValChange={this.handleTextInputChange}/>
      <br/>
      <div>
        <button id='hide' onClick={this.hide}>Hide Text</button>
        <button id='hidefile' onClick={this.hidefile}>Hide Text From File</button>
        <button id='read' onClick={this.read}>Read Hidden Message</button>
      </div>
      <Output text={this.state.display}/>
      <br/><br/>
      </header>
      </div>
    );
  }
}
