import React from 'react';

import {
  fromEvent,
} from 'rxjs';
import {
  windowWhen,
  map,
  skip,
  mergeAll, takeUntil,
} from 'rxjs/operators';
import PropTypes from 'prop-types';

import Style from './index.module.scss'

const noop = () => null;

export class BoxPreviewer extends React.PureComponent {
  static propTypes = {
    onPreviewDone: PropTypes.func,
  }

  static defaultProps = {
    onPreviewDone: noop,
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
      windowWhen(() => down$),
      map(win => win.pipe(takeUntil((up$)))),
      skip(1),
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
        width: Math.abs(rest.previewBoxWidth),
        height: Math.abs(rest.previewBoxHeight),
        boxStyle: this.getPreviewBoxStyle(),
        boxIndex: boxesProps.length,
      }
      this.props.onPreviewDone(boxProps);
    }

    this.resetPreviewBoxState(beforeReset);
  };

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

  render() {
    return this.renderPreviewBox();
  }
}
