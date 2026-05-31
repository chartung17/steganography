import React from 'react';

export default class Output extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: props.text
    }
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
    const { text } = this.state;
    const isUrl = text.startsWith('http') || text.startsWith('blob:');
    const isBlob = text.startsWith('blob:');

    return (
      <div className='output'>
        {isUrl
          ? (
            <div style={{ flexDirection: 'column', alignItems: 'center' }}>
              <p>
                {isBlob
                  ? 'Your encoded image is ready: '
                  : 'The file containing your hidden message can be found at '}
                <a href={text} download={isBlob ? 'encoded.png' : undefined}>{text}</a>
              </p>
              <img
                src={text}
                alt='Output preview'
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', marginTop: '8px' }}
              />
            </div>
          )
          : <p>{text}</p>}
      </div>
    );
  }
}