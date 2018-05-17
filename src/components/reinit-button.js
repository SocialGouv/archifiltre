import React from 'react'
import { connect } from 'react-redux'

import { mkB } from 'components/button'

import { reInit as re1 } from 'reducers/database'
import { reInit as re2 } from 'reducers/app-state'
import { setNoFocus as re4 } from 'reducers/icicle-state'
import { setNoDisplayRoot as re5 } from 'reducers/icicle-state'

import { commit } from 'reducers/root-reducer'

import { tr } from 'dict'

const Presentational = props => {

  return mkB(props.reInitStateApp, tr("Reset"), true, "#e04d1c")
}



const mapStateToProps = state => {
  return {}
}

const mapDispatchToProps = dispatch => {
  return {
    reInitStateApp: (...args) => {
      dispatch(re1())
      dispatch(re2())
      dispatch(re4())
      dispatch(re5())
      dispatch(commit())
    }
  }
}


const Container = connect(
  mapStateToProps,
  mapDispatchToProps
)(Presentational)

export default Container
