import React from 'react';
import {
  fromEvent,
} from 'rxjs';
import {
  skipUntil,
  takeUntil,
  map,
  take,
  takeLast,
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
    const drawPreviewBox$= this.getDrawPreviewBoxObservable();
    let onDrawStart$ = drawPreviewBox$.pipe(take(1));
    let onDrawEnd$ = drawPreviewBox$.pipe(takeLast(1));

    drawPreviewBox$.subscribe(this.setPreviewBoxSize)
    onDrawStart$.subscribe(this.setPreviewBoxStartPos)
    onDrawEnd$.subscribe(this.onDrawBoxDone)
  };

  mountNewBox = (children) => {
    const newBox = React.createElement('div', { style: this.getPreviewBoxStyle() }, children);
    this.boxes.push(newBox);
    return newBox;
  };

  onDrawBoxDone = () => {
    const beforeReset = (prevState) => {
      if (!(prevState.previewBoxWidth && prevState.previewBoxWidth)) {
        return;
      }
      this.mountNewBox(this.props.buildBoxContent({
        ...prevState,
        boxIndex: this.boxes.length,
      }))
    }

    const afterReset = () => {
      this.box= [];
      this.initDrawingObservables();
    };

    this.resetPreviewBoxState(
      beforeReset,
      afterReset,
    );
  };

  getDrawPreviewBoxObservable = () => {
    const move$ = fromEvent(document, 'mousemove');
    const down$ = fromEvent(document, 'mousedown');
    const up$ = fromEvent(document, 'mouseup')

    return move$.pipe(
      skipUntil(down$),
      takeUntil(up$),
      map(e => ({x: e.clientX, y: e.clientY})),
    );
  }

  setCanvasRef = (ref) => {
    this.canvas = ref;
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
      this.initDrawingObservables();
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

  render() {
    return (
      <div
        className={Style.canvas}
        ref={this.setCanvasRef}
      >
        {this.boxes}
        {this.renderPreviewBox()}
        {this.renderClearButton()}
      </div>
    );
  }
}