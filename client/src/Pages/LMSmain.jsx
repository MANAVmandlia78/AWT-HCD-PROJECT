import Sidebar from '../Components/Sidebar'
import Maindashboard from '../Components/Maindashboard'
import "../Styles/LMSmain.css"
import Profile from "../Pages/ProfilePage"
// import QuizPage from '../Components/Quiz'
import React from 'react'
import Calendar from '../Components/Calendar'
import CourseDetail from '../Pages/CourseDetail'
import Assignments from './Assignments'
import Submissions from './Submissions'
import TeacherAssignments from './TeacherAssignments'

const LMSmain = () => {
  return (
    <div className="lms-layout">
        <Sidebar></Sidebar>
        {/* <Maindashboard></Maindashboard> */}
        {/* <CourseDetail></CourseDetail> */}
        {/* <Profile></Profile> */}
        <Assignments></Assignments>
        {/* <Submissions></Submissions> */}
        {/* <TeacherAssignments></TeacherAssignments> */}
        {/* <Calendar></Calendar> */}
    </div>
  )
}

export default LMSmain