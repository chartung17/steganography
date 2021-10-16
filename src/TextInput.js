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
      <textarea rows="10" name='text-input' value={this.state.text} onChange={this.handleChange}/>
      </div>
    );
  }
}
