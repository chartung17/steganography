import React from 'react';

export default class Output extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: props.text
    }
    // this.handleTextChange = this.handleTextChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props === prevProps) {
      return;
    }
    this.setState({
      text: this.props.text
    });
  }

  render() {
    let text = 'The file containing your hidden message can be found at ';
    return (
      <div className='output'>
        {this.state.text.startsWith('http')
          ? <p>{text}<a href={this.state.text}>{this.state.text}</a></p>
          : <p>{this.state.text}</p>}
      </div>
    );
  }
}
