import React from 'react';
import { produce } from "immer"
import PropTypes from 'prop-types';

export class BoxesManager extends React.PureComponent {
  static propTypes = {
    children: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      boxMap: {}
    }
  }

  setBoxState = (fn) => {
    this.setState(prevState => {
      return produce(prevState, (draftState) => {
        fn(draftState.boxMap);
      })
    })
  }

  addBox = (id, boxProps) => {
    this.setBoxState((boxMap) => {
      boxMap[id] = boxProps;
    })
  }

  removeBox = (id) => {
    this.setBoxState((boxMap) => {
      delete boxMap[id]
    })
  }

  removeAllBoxes = () => {
    this.setBoxState((boxMap) => {
      boxMap = {};
    })
  }

  updateBox = (id, updater) => {
    this.setBoxState((boxes) => {
      updater(boxes[id]);
    })
  }

  listBoxes = () => {
    const { boxMap } = this.state;
    const boxes = Object.getOwnPropertySymbols(boxMap).map(s => boxMap[s])
    return boxes.sort((a, b) => {
      return a.updateTime - b.updateTime
    });
  }

  render() {
    const { children } = this.props;
    return children({
      addBox: this.addBox,
      removeBox: this.removeBox,
      updateBox: this.updateBox,
      clearBoxes: this.removeAllBoxes,
      boxes: this.listBoxes()
    })
  }

}
