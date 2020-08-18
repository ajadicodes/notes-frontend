import React, { useState, useEffect, useRef } from 'react'
import Note from './components/Note'
import noteServices from './services/notes'
import Notification from './components/Notification'
import './index.css'
import Footer from './components/Footer'
import loginServices from './services/login'
import LoginForm from './components/LoginForm'
import Togglable from './components/Togglable'
import NoteForm from './components/NoteForm'

const App = () => {
  const [notes, setNotes] = useState([])
  const [showAll, setShowAll] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)

  const noteFormRef = useRef()

  useEffect(() => {
    noteServices.getAll().then((initialNote) => {
      setNotes(initialNote)
    })
  }, [])

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedNoteappUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      noteServices.setToken(user.token)
    }
  }, [])

  const notesToShow = showAll
    ? notes
    : notes.filter((note) => note.important === true)

  const toggleImportanceOf = (id) => {
    const note = notes.find((n) => n.id === id)
    const changeNote = { ...note, important: !note.important }

    noteServices
      .update(id, changeNote)
      .then((returnedNote) => {
        setNotes(notes.map((note) => (note.id !== id ? note : returnedNote)))
      })
      .catch(() => {
        setErrorMessage(
          `Note '${note.content}' was already removed from server.`
        )
        setTimeout(() => {
          console.log('set time is active')
          setErrorMessage(null)
        }, 5000)

        setNotes(notes.filter((n) => n.id !== id))
      })
  }

  // this method is responsible for handling the data in the form.
  // Logging in is done by sending an HTTP POST request to server address
  // *api/login*. The code responsible for this request is separated to its
  // own module. See *services/login.js*

  // If the login is successful, the form fields are emptied and the server
  // response (including a *token* and the user details) is saved to the *user*
  // field of the application's state.

  // If the login fails, or running the function `loginService.login` results
  // in an error, the user is notified.
  const handleLogin = async (event) => {
    event.preventDefault()
    try {
      const user = await loginServices.login({
        username,
        password,
      })

      // values saved to the storage are
      // [DOMstrings](https://developer.mozilla.org/en-US/docs/Web/API/DOMString)
      // so we cannot save a JavaScript object as is.
      // The object has to be parsed to JSON first, with the method `JSON.stringify`.
      // Correspondingly, whe a JSON object is read from the local storage,
      // it has to be parsed back to JavaScript with `JSON.parse`
      window.localStorage.setItem('loggedNoteappUser', JSON.stringify(user))

      // here we set the token from a successful login which will be added
      // to the create header
      noteServices.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
    } catch (exception) {
      setErrorMessage('Wrong credentials')
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    }
  }

  const addNote = (noteObject) => {
    noteFormRef.current.toggleVisibility()
    noteServices.create(noteObject).then((returnedNote) => {
      setNotes(notes.concat(returnedNote))
    })
  }

  const loginForm = () => (
    <Togglable buttonLabel="login">
      <LoginForm
        username={username}
        password={password}
        handleUsernameChange={({ target }) => setUsername(target.value)}
        handlePasswordChange={({ target }) => setPassword(target.value)}
        handleSubmit={handleLogin}
      />
    </Togglable>
  )

  // generate note form component
  const noteForm = () => (
    <Togglable buttonLabel="new note" ref={noteFormRef}>
      <NoteForm createNote={addNote} />
    </Togglable>
  )

  return (
    <div>
      <h1>Notes</h1>
      <Notification message={errorMessage} />
      {user === null ? (
        loginForm()
      ) : (
        <div>
          <p>{user.name} logged in</p>
          {noteForm()}
        </div>
      )}
      <div>
        <button onClick={() => setShowAll(!showAll)}>
          show {showAll ? 'important' : 'all'}
        </button>
      </div>
      <ul>
        {notesToShow.map((note) => (
          <Note
            key={note.id}
            note={note}
            toggleImportance={() => toggleImportanceOf(note.id)}
          />
        ))}
      </ul>

      <Footer />
    </div>
  )
}

export default App
