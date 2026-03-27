// ==UserScript==
// @name         proton calendar
// @namespace    https://github.com/remigermain
// @version      2026-03-27
// @description  proton calendar extra modals
// @author       Germain Remi
// @match        https://calendar.proton.me/*
// @grant        none
// ==/UserScript==

;(function () {
  'use strict'

  const delay = (ms) => new Promise((res) => setTimeout(res, ms))

  // parse url paths
  const getPaths = () => window.location.pathname.split('/').filter((v) => v)

  const selectCalendar = () => {
    const selectMonth = document.getElementById('ProtonExtraMonth')
    const selectYears = document.getElementById('ProtonExtraYears')

    return [selectYears, selectMonth]
  }

  const protonValueCalendar = () => {
    // proton calendar url like '/u/0/month/2015/1/27'

    const paths = getPaths().slice(3)

    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setFullYear(parseInt(paths[0], 10) || date.getFullYear())
    date.setMonth(parseInt(paths[1], 10) - 1 || date.getMonth())
    date.setDate(parseInt(paths[2], 10) || date.getDate())

    return date
  }

  const selectedValueCalendar = () => {
    const [selectYears, selectMonth] = selectCalendar()

    const selectedDate = protonValueCalendar()
    selectedDate.setHours(0, 0, 0, 0)
    selectedDate.setDate(1)
    selectedDate.setFullYear(parseInt(selectYears.value, 10))
    selectedDate.setMonth(parseInt(selectMonth.value, 10))

    return selectedDate
  }

  const btnMiniCalendar = () => {
    const prevBtn = document.querySelector(`[data-testid="minicalendar:previous-month"]`)
    const nextBtn = document.querySelector(`[data-testid="minicalendar:next-month"]`)

    return [prevBtn, nextBtn]
  }

  const generateMonths = () => {
    // generate month names by locale language
    const formater = new Intl.DateTimeFormat(navigator.language, { month: 'long' })

    return Array.from(Array(12).keys()).map((index) => {
      const date = new Date()
      date.setMonth(index)
      const label = formater.format(date)
      return {
        value: index,
        label: `${label[0].toUpperCase()}${label.slice(1)}`,
      }
    })
  }

  const generateYears = () => {
    // generate years before / after (before 2037 (calendar not work after this year))
    const PADDING = 60
    const now = new Date().getFullYear() - PADDING / 2
    return Array.from(Array(PADDING).keys())
      .map((index) => {
        return {
          value: now + index,
          label: now + index,
        }
      })
      .toReversed()
      .filter(({ value }) => value <= 2037)
  }

  const selectCreate = (choices, id, defaultValue) => {
    const container = document.createElement('div')
    container.classList.add(
      'select',
      'field',
      'outline-none',
      'flex',
      'justify-space-between',
      'items-center',
      'flex-nowrap',
      'relative'
    )
    container.innerHTML = `<svg id="ProtonExtraIcon${id}" viewBox="0 0 16 16" class="icon-size-4 shrink-0 ml-1" role="img" focusable="false" aria-hidden="true"><use xlink:href="#ic-chevron-down-filled"></use></svg>`

    const hidden = document.createElement('div')
    hidden.id = `ProtonExtraHide${id}`
    const select = document.createElement('select')
    select.id = `ProtonExtra${id}`
    select.classList.add('text-center', 'px-12', 'absolute', 'left-0')

    choices.forEach(({ label, value }) => {
      const item = document.createElement('option')
      item.value = value
      item.innerText = label
      select.appendChild(item)
    })

    select.value = defaultValue
    container.prepend(hidden)
    container.prepend(select)

    return container
  }

  const actionSelectDate = async () => {
    const date = protonValueCalendar()
    const selectedDate = selectedValueCalendar()

    const diffYears = selectedDate.getFullYear() - date.getFullYear()
    const diffMonth = selectedDate.getMonth() - date.getMonth()

    // number needed to click next/prev
    const numberOfClick = diffYears * 12 + diffMonth

    const [prevMini, nextMini] = btnMiniCalendar()
    const btn = numberOfClick <= 0 ? prevMini : nextMini

    // click each "prev" or "next" button
    for (const _ of Array.from(Array(Math.abs(numberOfClick)))) {
      btn.click()
      await delay(1)
    }

    // detect the lastDay (check is not out-of-month going from 31 march to 31 febuary, get day -X when day is not out=of-mount)
    await delay(1)
    const day = date.getDate()
    for (const element of Array.from(
      document.querySelectorAll(`.minicalendar-monthdays .minicalendar-day-number`)
    ).toReversed()) {
      if (element.parentElement.classList.contains('minicalendar-day--out-of-month')) {
        continue
      }

      const value = parseInt(element.innerText, 10)
      if (value <= day) {
        await delay(1)
        element.parentElement.click()
        break
      }
    }
  }

  const showModal = () => {
    document.getElementById('ProtonExtraModal').style.display = 'flex'
    // set calendar value
    const [selectYears, selectMonth] = selectCalendar()

    const date = protonValueCalendar()
    selectMonth.value = date.getMonth()
    selectYears.value = date.getFullYear()

    // calculate select html size
    const boundingMonth = document.querySelector(`#ProtonExtraMonth`).getBoundingClientRect()
    const boundingSvgMonth = document.querySelector(`#ProtonExtraIconMonth`).getBoundingClientRect()
    document.querySelector(`#ProtonExtraHideMonth`).style.width =
      `${boundingMonth.width - boundingSvgMonth.width}px`

    const boundingYear = document.querySelector(`#ProtonExtraYears`).getBoundingClientRect()
    const boundingSvgyear = document.querySelector(`#ProtonExtraIconYears`).getBoundingClientRect()
    document.querySelector(`#ProtonExtraHideYears`).style.width =
      `${boundingYear.width - boundingSvgyear.width}px`
  }

  const hideModal = () => {
    document.getElementById('ProtonExtraModal').style.display = 'none'
  }

  // create modal with proton style, to select month/year
  const createModal = () => {
    const modal = document.createElement('div')
    modal.id = 'ProtonExtraModal'
    modal.classList.add('modal-two', 'modal-two--fullscreen-on-mobile')
    modal.style.display = 'none'
    modal.style.backgroundColor = '#0000008a'

    const dialog = document.createElement('dialog')
    dialog.classList.add('modal-two-dialog', 'outline-none', 'w-full', 'modal-two-dialog--large')

    const container = document.createElement('div')
    container.classList.add('modal-two-dialog-container')
    container.innerHTML = `<div class="modal-two-header"><div class="flex flex-nowrap shrink-0 items-start justify-between"><strong class="w-full text-center bold">Select a Date</strong><div class="modal-two-header-actions flex shrink-0 flex-nowrap items-stretch"><button id="closeExtraModal" class="button button-for-icon button-medium button-ghost-weak shrink-0" aria-busy="false" data-testid="modal:close" type="button" aria-describedby="tooltip-3580"><svg viewBox="0 0 16 16" class="icon-size-4 modal-close-icon" role="img" focusable="false" aria-hidden="true"><use xlink:href="#ic-cross-big"></use></svg><span class="sr-only">Fermer</span></button></div></div></div>`

    container.querySelector('#closeExtraModal').addEventListener('click', hideModal)

    const date = protonValueCalendar()
    const selectMonth = selectCreate(generateMonths(), 'Month', date.getMonth())
    const selectYears = selectCreate(generateYears(), 'Years', date.getFullYear())

    const div = document.createElement('div')
    div.classList.add(
      'flex',
      'justify-center',
      'items-center',
      'gap-4',
      'p-1',
      'text-center',
      'px-2'
    )
    div.appendChild(selectMonth)
    div.appendChild(selectYears)

    container.appendChild(div)

    const containerFooter = document.createElement('div')
    containerFooter.classList.add('modal-two-footer')

    const button = document.createElement('button')
    button.classList.add('button', 'button-medium', 'button-solid-norm', 'w-full', 'sm:w-auto')
    button.innerText = 'Ok'
    button.addEventListener('click', () => {
      actionSelectDate()
      hideModal()
    })

    containerFooter.appendChild(document.createElement('span'))
    containerFooter.appendChild(button)
    container.appendChild(containerFooter)
    dialog.appendChild(container)
    modal.appendChild(dialog)

    document.body.appendChild(modal)
  }

  const init = () => {
    const calendarToolbarNext = document.querySelector(`[data-testid="calendar-toolbar:next"]`)
    const modal = document.getElementById('ProtonExtraModal')

    // waiting all dom are loaded or if modal already create, ignore
    if (!calendarToolbarNext || modal) {
      return
    }

    createModal()

    const toolbar = calendarToolbarNext.parentElement
    const displayDate = toolbar.querySelector('h2')

    displayDate.style.cursor = 'pointer'
    displayDate.style.padding = '0 .5rem'
    displayDate.style.borderRadius = '10px'
    displayDate.addEventListener('mouseover', () => {
      displayDate.style.transform = 'scale(1.05)'
      displayDate.style.backgroundColor = 'var(--interaction-default-hover)'
    })
    displayDate.addEventListener('mouseleave', () => {
      displayDate.style.transform = 'unset'
      displayDate.style.backgroundColor = 'unset'
    })

    displayDate.addEventListener('click', () => showModal())
  }

  const createObserver = () => {
    const observer = new MutationObserver(init)
    observer.observe(document.body, { subtree: true, childList: true })
  }

  if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
    createObserver()
  } else {
    document.addEventListener('DOMContentLoaded', createObserver)
  }
})()
