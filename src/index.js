import React from 'react';

import PropTypes from 'prop-types';

import Style from './index.module.scss'
import { BoxPreviewer } from './box_preview';

const noop = () => null;

export class BoxCanvas extends React.PureComponent {
  static propTypes = {
    staticBoxRenderer: PropTypes.func,
    clearButtonRenderer: PropTypes.func,
  }

  static defaultProps = {
    staticBoxRenderer: noop,
    clearButtonRenderer: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      boxesProps: [],
    }
  }


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
      { style: props.boxStyle },
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