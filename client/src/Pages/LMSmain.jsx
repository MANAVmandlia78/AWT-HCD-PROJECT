import Sidebar from '../Components/Sidebar'
import Maindashboard from '../Components/Maindashboard'
import "../Styles/LMSmain.css"

import React from 'react'

const LMSmain = () => {
  return (
    <div className="lms-layout">
        <Sidebar></Sidebar>
        <Maindashboard></Maindashboard>
    </div>
  )
}

export default LMSmain