

import React from 'react'

import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import rootReducer from 'reducers/root-reducer'

import MainSpace from 'components/main-space'
import Header from 'components/header'

import 'css/app.css'


import { logError } from 'api-call'
import { getCookie } from 'cookie'

import ErrorBoundary from 'components/error-boundary'

import * as qs from 'query-string'
import { generateRandomString } from 'random-gen'


const app = () => {
  let root_div = document.createElement('div')
  root_div.setAttribute('id','root')

  if (document.body !== null) {
    document.body.appendChild(root_div)
  }

  let store = createStore(rootReducer, applyMiddleware(thunk))

  window.thug = Object.assign({},window.thug,{
    dispatch: store.dispatch,
    getState: store.getState
  })

  ReactDOM.render(
    <ErrorBoundary>
      <Provider store={store}>
        <div className='grid-y grid-padding-y grid-frame'>
          <div className='cell'>
            <Header/>
          </div>
          <div className='cell auto'>
            <MainSpace/>
          </div>
        </div>
      </Provider>
    </ErrorBoundary>,
    root_div
  )
}

window.onload = () => {
  try {
    app()
  } catch(e) {
    if (!getCookie().impicklerick) {
      logError(e.stack)
    } else {
      throw e
    }
  }
}

if (!getCookie().impicklerick) {
  window.onbeforeunload = () => false
}

