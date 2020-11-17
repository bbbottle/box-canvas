import React from 'react';

import PropTypes from 'prop-types';

import Style from './index.module.scss'
import { BoxPreviewer } from './box_preview';

const noop = () => null;

export class BoxCanvas extends React.PureComponent {
  static propTypes = {
    staticBoxRenderer: PropTypes.func,
    clearButtonRenderer: PropTypes.func,
    attachLineGutter: PropTypes.number, // set value will enable auto attach
  }

  static defaultProps = {
    staticBoxRenderer: noop,
    clearButtonRenderer: null,
    attachLineGutter: 0,
  }

  constructor(props) {
    super(props);
    this.state = {
      boxesProps: [],
    }
  }

  getPosAfterAttach = (pos) => {
    const {
      attachLineGutter
    } = this.props;
    if (!attachLineGutter
      || typeof attachLineGutter !== 'number'
      || attachLineGutter < 0
    ) {
      return pos;
    }

    const offset = pos % attachLineGutter;
    if (pos - offset < 0) {
      return pos;
    }
    return pos - offset;
  };

  createNewBox = (boxProps) => {
    this.setState(prevState => ({
      boxesProps: [...prevState.boxesProps, boxProps],
    }))
  };

  setCanvasRef = (ref) => {
    this.canvas = ref;
  }

  setStaticBoxContainerRef = (ref) => {
    this.staticBoxContainer = ref;
  }

  handleClear = (e) => {
    e.stopPropagation();
    this.setState({ boxesProps: [] });
  };

  renderPreviewBox = () => {
    return (
      <BoxPreviewer
        onPreviewDone={this.createNewBox}
      />
    )
  };

  renderClearButton = () => {
    const clearBtnJsx = (
      <button
        onClick={this.handleClear}
        className={Style.clearBtn}
      >
        reset
      </button>
    );

    if (this.props.clearButtonRenderer) {
      try {
        return this.props.clearButtonRenderer({
          clear: this.handleClear,
        });
      } catch (err) {
        return clearBtnJsx;
      }
    }

    return clearBtnJsx;
  };

  renderStaticBoxes = () => {
    const { boxesProps } = this.state;
    const { staticBoxRenderer } = this.props;

    const staticBoxes = boxesProps.map(props => React.createElement(
      'div',
      {
        style: {
          ...props.boxStyle,
          left: this.getPosAfterAttach(props.boxStyle.left),
          top: this.getPosAfterAttach(props.boxStyle.top),
        }
      },
      staticBoxRenderer(props)
    ))

    return (
      <div
        className={Style.staticBoxContainer}
        ref={this.setStaticBoxContainerRef}
      >
        {staticBoxes}
      </div>
    )
  }

  render() {
    return (
      <div
        className={Style.canvas}
        ref={this.setCanvasRef}
      >
        {this.renderStaticBoxes()}
        {this.renderPreviewBox()}
        {this.renderClearButton()}
      </div>
    );
  }
}