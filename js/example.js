import Selective from './selective'
import {
  MDCTextField
} from '@material/textfield'

const configEl = document.querySelector('#config')
const configMdc = document.querySelector('.content__config .mdc-text-field')
const dataEl = document.querySelector('#data')
const dataMdc = document.querySelector('.content__data .mdc-text-field')
const fieldsEl = document.querySelector('#fields')
const valueEl = document.querySelector('#value')
const valueMdc = document.querySelector('.content__value .mdc-text-field')

// -----------------------------------------------------------
// Basic example of using Selective.
// -----------------------------------------------------------

const exampleSelective = new Selective(fieldsEl, JSON.parse(configEl.value))

exampleSelective.data = JSON.parse(dataEl.value)


// -----------------------------------------------------------
// Functionality for making the example page function.
// -----------------------------------------------------------

// Make the object available in the global scope for ad lib testing.
window.selective = exampleSelective

// Create the example MDC components.
new MDCTextField(configMdc)
new MDCTextField(dataMdc)
new MDCTextField(valueMdc)

const handleValueChange = (e) => {
  valueEl.textContent = JSON.stringify(exampleSelective.value, null, 2)
}
handleValueChange()
window.setInterval(handleValueChange, 2000)


const handleCleanCheck = (e) => {
  console.log('Is Clean?', exampleSelective.isClean);
}
window.setTimeout(handleCleanCheck, 3000)

const handleUpdate = () => {
  exampleSelective.update({
    "title": "The stuff nightmares are made of.",
  })
  console.log('Updated data. Is Clean?', exampleSelective.isClean);
}
window.setTimeout(handleUpdate, 6000)
