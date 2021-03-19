import React from 'react';

import {fromEvent,} from 'rxjs';
import PropTypes from 'prop-types';

import Style from './index.module.scss'

import {filter, map, mergeAll, skip, takeUntil, windowWhen,} from 'rxjs/operators';

const noop = () => null;

export class BoxPreviewer extends React.PureComponent {
  static propTypes = {
    onPreviewDone: PropTypes.func,
    onPreviewStart: PropTypes.func,
    renderer: PropTypes.func,
  }

  static defaultProps = {
    onPreviewDone: noop,
    onPreviewStart: noop,
    renderer: null,
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

  // componentDidMount() {
  //   this.initDrawingObservables();
  // }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.canvasDom !== this.props.canvasDom && this.props.canvasDom) {
      this.initDrawingObservables(this.props.canvasDom);
    }
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

    this.props.onPreviewStart(previewBoxStartX, previewBoxStartY)
    this.setState({
      previewBoxStartX,
      previewBoxStartY,
      previewBoxWidth: 0,
      previewBoxHeight: 0,
    });
  };


  setPreviewBoxProps = (pos) => {
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
      previewBoxEndX: cursorX,
      previewBoxEndY: cursorY,
    })
  }

  initDrawingObservables = ($canvas) => {
    const move$ = fromEvent(document, 'mousemove');
    const originDown$ = fromEvent($canvas, 'mousedown');
    const down$ = originDown$.pipe(
      filter(e => {
        const leftButton = 0;
        return e.button === leftButton
          && e.target === $canvas;
      })
    )
    const up$ = fromEvent(document, 'mouseup')

    const drawPreviewBoxMove$ = move$.pipe(
      windowWhen(() => down$),
      map(win => win.pipe(takeUntil((up$)))),
      skip(1),
      mergeAll()
    );

    drawPreviewBoxMove$.subscribe(this.setPreviewBoxProps)
    down$.subscribe(this.setPreviewBoxStartPos)
    up$.subscribe(this.onDrawBoxDone)
  };

  onDrawBoxDone = () => {
    const beforeReset = (prevState) => {
      if (!(prevState.previewBoxWidth && prevState.previewBoxWidth)) {
        return;
      }

      const boxProps = {
        ...prevState,
        width: Math.abs(prevState.previewBoxWidth),
        height: Math.abs(prevState.previewBoxHeight),
        boxStyle: this.getPreviewBoxStyle(),
      }
      this.props.onPreviewDone(boxProps);
    }

    this.resetPreviewBoxState(beforeReset);
  };

  getPreviewBoxStyle = () => {
    const {
      previewBoxStartX,
      previewBoxStartY,
      previewBoxEndX,
      previewBoxEndY,
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
      startPos: [previewBoxStartX, previewBoxStartY],
      endPos: [previewBoxEndX, previewBoxEndY]
    }

    return Object.assign({position: 'absolute'}, pos, size);
  };

  renderPreviewBox = () => {
    const style = this.getPreviewBoxStyle();
    if (!(style.width && style.height)) {
      return null;
    }
    if (this.props.renderer) {
      return this.props.renderer(style);
    }
    return (
      <div
        style={style}
        className={Style.previewBox}
      />
    );
  };

  render() {
    return this.renderPreviewBox();
  }
}
