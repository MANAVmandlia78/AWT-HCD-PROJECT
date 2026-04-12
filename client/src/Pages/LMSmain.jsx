import Sidebar from '../Components/Sidebar'
import Maindashboard from '../Components/Maindashboard'
import "../Styles/LMSmain.css"
import Profile from "../Pages/ProfilePage"
import { Outlet } from "react-router-dom";
// import QuizPage from '../Components/Quiz'
import React from 'react'
import Calendar from '../Components/Calendar'
import CourseDetail from '../Pages/CourseDetail'
import Assignments from './Assignments'
import Submissions from './Submissions'
import TeacherAssignments from './TeacherAssignments'
import TeacherQuiz from './TeacherQuiz'
import StudentQuiz from './StudentQuiz'
import QuizList from './QuizList'
import TeacherCourses from '../Components/TeacherCourses'
import EnrollCourse from '../Components/EnrollCourse'
const LMSmain = () => {
  return (
    <div className="lms-layout">
        <Sidebar></Sidebar>
        <Outlet />
  
        {/* <Maindashboard></Maindashboard> */}
        {/* <TeacherCourses></TeacherCourses> */}
        {/* <EnrollCourse></EnrollCourse> */}
        {/* <CourseDetail></CourseDetail> */}
        {/* <Profile></Profile> */}
        {/* <TeacherQuiz></TeacherQuiz> */}
        {/* <StudentQuiz></StudentQuiz> */}
        {/* <Assignments></Assignments> */}
        {/* <Submissions></Submissions> */}
        {/* <QuizList></QuizList> */}
        {/* <TeacherAssignments></TeacherAssignments> */}
        {/* <Calendar></Calendar> */}
    </div>
  )
}

export default LMSmain