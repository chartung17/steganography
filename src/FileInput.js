import React from 'react';

export default class TextInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: ''
    }
    this.handleChange = this.handleChange.bind(this);
  }

  // handle change in state
  handleChange(e) {
    this.setState({
      text: e.target.value
    });
    this.props.handleValChange(e.target.value);
  }

  render() {
    return (
      <div className='input'>
      <input name='file-input' value={this.state.text} onChange={this.handleChange}/>
      </div>
    );
  }
}
