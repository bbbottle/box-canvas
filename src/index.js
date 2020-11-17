import React from 'react';

import PropTypes from 'prop-types';

import Style from './index.module.scss'
import { BoxPreviewer } from './box_preview';
import { BoxesManager } from './boxes_manager';

const noop = () => null;

const StylePropType = PropTypes.shape({
  left: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  position: PropTypes.string.isRequired,
});

const BoxPropType = PropTypes.shape({
  previewBoxStartX: PropTypes.number.isRequired,
  previewBoxStartY: PropTypes.number.isRequired,

  // may be negative value
  previewBoxWidth: PropTypes.number.isRequired,
  previewBoxHeight: PropTypes.number.isRequired,

  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,

  boxIndex: PropTypes.number.isRequired,
  boxStyle: StylePropType,
});

class BaseBoxCanvas extends React.PureComponent {
  static propTypes = {
    staticBoxRenderer: PropTypes.func,
    clearButtonRenderer: PropTypes.func,
    attachLineGutter: PropTypes.number, // set value will enable auto attach

    // from parent
    addBox: PropTypes.func.isRequired,
    clearBoxes: PropTypes.func.isRequired,
    removeBox: PropTypes.func.isRequired,
    updateBox: PropTypes.func.isRequired,
    boxes: PropTypes.arrayOf(BoxPropType).isRequired,
  }

  static defaultProps = {
    staticBoxRenderer: noop,
    clearButtonRenderer: null,
    attachLineGutter: 0,
  }

  constructor(props) {
    super(props);
  }

  getPosAfterAttach = (pos, incMode) => {
    const {
      attachLineGutter
    } = this.props;
    if (!attachLineGutter
      || typeof attachLineGutter !== 'number'
      || attachLineGutter < 0
    ) {
      return pos;
    }

    if (incMode) {
      const offset = attachLineGutter - pos % attachLineGutter;
      return pos + offset;
    }

    const offset = pos % attachLineGutter;
    if (pos - offset < 0) {
      return pos;
    }
    return pos - offset;
  };

  setCanvasRef = (ref) => {
    this.canvas = ref;
  }

  setStaticBoxContainerRef = (ref) => {
    this.staticBoxContainer = ref;
  }

  handleClear = (e) => {
    e.stopPropagation();
    this.props.clearBoxes();
  };

  renderPreviewBox = () => {
    return (
      <BoxPreviewer
        onPreviewDone={this.props.addBox}
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
    const {
      staticBoxRenderer,
      boxes: boxesProps
    } = this.props;

    const staticBoxes = boxesProps.map(props => React.createElement(
      'div',
      {
        style: {
          ...props.boxStyle,
          width: this.getPosAfterAttach(props.boxStyle.width, true),
          height: this.getPosAfterAttach(props.boxStyle.height, true),
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

export const BoxCanvas = (props) => {
  return (
    <BoxesManager>
      {(manageMethods) => (
        <BaseBoxCanvas
          {...props}
          {...manageMethods}
        />
      )}
    </BoxesManager>
  )
}