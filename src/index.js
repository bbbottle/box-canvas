import React from 'react';

import {
  fromEvent,
  merge,
} from 'rxjs';
import {
  windowWhen,
  filter,
  mergeAll,
} from 'rxjs/operators';
import PropTypes from 'prop-types';

import Style from './index.module.scss'

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
      previewBoxStartX: 0,
      previewBoxStartY: 0,
      previewBoxWidth: 0,
      previewBoxHeight: 0,

      boxesProps: [],
    }
  }


  componentDidMount() {
    this.initDrawingObservables();
  }

  resetPreviewBoxState = (before = noop, after = noop) => {
    this.setState((prevState) => {
      before(prevState);
      return {
        previewBoxStartX: 0,
        previewBoxStartY: 0,
        previewBoxWidth: 0,
        previewBoxHeight: 0,
      }
    }, () => {
      after();
    })
  };

  setPreviewBoxStartPos = (pos) => {
    const {
      x: previewBoxStartX,
      y: previewBoxStartY
    } = pos;

    this.setState({
      previewBoxStartX,
      previewBoxStartY,
      previewBoxWidth: 0,
      previewBoxHeight: 0,
    });
  };


  setPreviewBoxSize = (pos) => {
    const {
      x: cursorX,
      y: cursorY
    } = pos;

    const {
      previewBoxStartX,
      previewBoxStartY,
    } = this.state;

    this.setState({
      previewBoxWidth: cursorX - previewBoxStartX,
      previewBoxHeight: cursorY - previewBoxStartY,
    })
  }

  initDrawingObservables = () => {
    const move$ = fromEvent(document, 'mousemove');
    const down$ = fromEvent(document, 'mousedown');
    const up$ = fromEvent(document, 'mouseup')

    const drawPreviewBoxMove$ = move$.pipe(
      // 鼠标落起窗口
      windowWhen(() => merge(down$, up$)),
      // 几数窗口即按下移动行为
      filter((win, index) => index % 2 !== 0),
      mergeAll()
    );

    drawPreviewBoxMove$.subscribe(this.setPreviewBoxSize)
    down$.subscribe(this.setPreviewBoxStartPos)
    up$.subscribe(this.onDrawBoxDone)
  };

  createNewBox = (boxProps) => {
    this.setState(prevState => ({
      boxesProps: [...prevState.boxesProps, boxProps],
    }))
  };

  onDrawBoxDone = () => {
    const beforeReset = (prevState) => {
      if (!(prevState.previewBoxWidth && prevState.previewBoxWidth)) {
        return;
      }

      const { boxesProps, ...rest } = prevState;
      const boxProps = {
        ...rest,
        boxStyle: this.getPreviewBoxStyle(),
        boxIndex: boxesProps.length,
      }
      this.createNewBox(boxProps);
    }

    this.resetPreviewBoxState(beforeReset);
  };

  setCanvasRef = (ref) => {
    this.canvas = ref;
  }

  setStaticBoxContainerRef = (ref) => {
    this.staticBoxContainer = ref;
  }

  getPreviewBoxStyle = () => {
    const {
      previewBoxStartX,
      previewBoxStartY,
      previewBoxWidth,
      previewBoxHeight,
    } = this.state;

    const size = {
      width: Math.abs(previewBoxWidth),
      height: Math.abs(previewBoxHeight),
    }

    const pos = {
      left: previewBoxWidth >= 0 ? previewBoxStartX : previewBoxStartX + previewBoxWidth,
      top: previewBoxHeight >= 0 ? previewBoxStartY : previewBoxStartY + previewBoxHeight,
    }

    return Object.assign({position: 'absolute'}, pos, size);
  };

  handleClear = (e) => {
    e.stopPropagation();
    this.setState({ boxesProps: [] });
  };

  renderPreviewBox = () => {
    const style = this.getPreviewBoxStyle();
    if (!(style.width && style.height)) {
      return null;
    }
    return (
      <div
        style={style}
        className={Style.previewBox}
      />
    );
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