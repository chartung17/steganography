import React from 'react';
import Output from './Output';
import TextInput from './TextInput';
import FileInput from './FileInput';
import './App.css';

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

  hide() {
    this.setState({
      display: 'Loading...'
    });
    let requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagefile: this.state.imagefile,
        text: this.state.text,
        textfile: "none"
      })
    };
    fetch("https://chartung17-steganography.herokuapp.com/hide", requestOptions)
    .then(res => {
      return res.json();
    }, err => {
      // Print the error if there is one.
      console.log(err);
    }).then(result => {
      let text = '';
      let success = false;
      if (result === undefined) {
        text = 'Unknown error occured'
      } else {
        success = result['status'] === 200;
        text = success ? result['link'] : result['message'];
      }
      this.setState({
        display: text,
        success: success
      });
    });
  }

  hidefile() {
    this.setState({
      display: 'Loading...'
    });
    let requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagefile: this.state.imagefile,
        text: '',
        textfile: this.state.text
      })
    };
    fetch("https://chartung17-steganography.herokuapp.com/hide", requestOptions)
    .then(res => {
      return res.json();
    }, err => {
      // Print the error if there is one.
      console.log(err);
    }).then(result => {
      let text = '';
      let success = false;
      if (result === undefined) {
        text = 'Unknown error occured'
      } else {
        success = result['status'] === 200;
        text = success ? result['link'] : result['message'];
      }
      this.setState({
        display: text,
        success: success
      });
    });
  }

  read() {
    this.setState({
      display: 'Loading...'
    });
    let requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagefile: this.state.imagefile,
        text: '',
        textfile: "none"
      })
    };
    fetch("https://chartung17-steganography.herokuapp.com/read", requestOptions)
    .then(res => {
      return res.json();
    }, err => {
      // Print the error if there is one.
      console.log(err);
    }).then(result => {
      let text = '';
      let success = false;
      if (result === undefined) {
        text = 'Unknown error occured'
      } else {
        success = result['status'] === 200;
        text = result['message'];
        if (success) text = 'Hidden message: ' + text;
      }
      this.setState({
        display: text,
        success: success
      });
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
      </header>
      </div>
    );
  }
}
