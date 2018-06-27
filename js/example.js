import Selective from './selective'

const configEl = document.querySelector('#config')
const dataEl = document.querySelector('#data')
const fieldsEl = document.querySelector('#fields')

const exampleSelective = new Selective(fieldsEl, JSON.parse(configEl.value))

exampleSelective.data = JSON.parse(dataEl.value)
