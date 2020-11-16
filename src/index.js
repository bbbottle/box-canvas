import React from 'react';
import ReactDOM from 'react-dom';

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
    buildBoxContent: PropTypes.func,
    clearButtonRenderer: PropTypes.func,
  }

  static defaultProps = {
    buildBoxContent: noop,
    clearButtonRenderer: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      previewBoxStartX: 0,
      previewBoxStartY: 0,
      previewBoxWidth: 0,
      previewBoxHeight: 0,
    }
  }

  boxes = [];

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

  mountNewBox = (Children) => {
    const boxStyle = this.getPreviewBoxStyle();
    const newBox = document.createElement('div');

    newBox.style.position = 'absolute';
    newBox.style.left = `${boxStyle.left}px`;
    newBox.style.top = `${boxStyle.top}px`;
    newBox.style.width = `${boxStyle.width}px`;
    newBox.style.height = `${boxStyle.height}px`;

    ReactDOM.render(Children, newBox);
    return this.staticBoxContainer.appendChild(newBox);
  };

  onDrawBoxDone = () => {
    const beforeReset = (prevState) => {
      if (!(prevState.previewBoxWidth && prevState.previewBoxWidth)) {
        return;
      }
      this.mountNewBox(this.props.buildBoxContent({
        ...prevState,
        boxStyle: this.getPreviewBoxStyle(),
        boxIndex: this.boxes.length,
      }))
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

    return Object.assign({}, pos, size);
  };

  handleClear = (e) => {
    e.stopPropagation();
    this.resetPreviewBoxState(noop, () => {
      this.boxes = [];
    })
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
    return (
      <div
        className={Style.staticBoxContainer}
        ref={this.setStaticBoxContainerRef}
      />
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