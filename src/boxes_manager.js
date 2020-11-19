import React from 'react';
import produce from "immer"


import PropTypes from 'prop-types';

export class BoxesManager extends React.PureComponent {
  static propTypes = {
    children: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      boxesProps: []
    }
  }

  setBoxState = (fn) => {
    this.setState(prevState => {
      return produce(prevState, (draftState) => {
        fn(draftState.boxesProps);
      })
    })
  }

  addBox = (box) => {
    this.setBoxState((boxes) => {
      boxes.push(box);
    })
  }

  removeBox = (idx) => {
    this.setBoxState((boxes) => {
      boxes[idx] = null;
    })
  }

  removeAllBoxes = () => {
    this.setBoxState((boxes) => {
      boxes.splice(0, boxes.length)
    })
  }

  updateBox = (idx, updater) => {
    this.setBoxState((boxes) => {
      updater(boxes[idx])
    })
  }

  render() {
    const {
      boxesProps
    } = this.state;

    const { children } = this.props;
    return children({
      addBox: this.addBox,
      removeBox: this.removeBox,
      updateBox: this.updateBox,
      clearBoxes: this.removeAllBoxes,
      boxes: boxesProps.slice(),
    })
  }

}
