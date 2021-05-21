import React, {useState} from 'react'
import {Link} from 'react-router-dom'
import axios from 'axios'
import { GoogleLogin } from 'react-google-login';

function Login() {
    const [user, setUser] = useState({
        email:'', password: ''
    })

    const onChangeInput = e =>{
        const {name, value} = e.target;
        setUser({...user, [name]:value})
    }

    const loginSubmit = async e =>{
        e.preventDefault()
        try {
            await axios.post('/user/login', {...user})

            localStorage.setItem('firstLogin', true)
            
            window.location.href = "/";
        } catch (err) {
            alert(err.response.data.msg)
        }
    }

    
    const responseGoogle = async (response) => {
        try {
            await axios.post('/user/google_login', {tokenId: response.tokenId})

            localStorage.setItem('firstLogin', true)
            
            window.location.href = "/";
        } catch (err) {
            alert(err.response.data.msg)
        }
    }

    return (
        <div className="login-page">
            <form onSubmit={loginSubmit}>
                <h2>Login</h2>
                <input type="email" name="email" required
                placeholder="Email" value={user.email} onChange={onChangeInput} />

                <input type="password" name="password" required autoComplete="on"
                placeholder="Password" value={user.password} onChange={onChangeInput} />

                <div className="row">
                    <button type="submit">Login</button>
                    <Link to="/register">Register</Link>
                </div>

                <div className="hr">or Login With</div>
                <div className="sosial">
                    <GoogleLogin
                    clientId="137165569186-mjjf13f1o3suraq8navul5pdsrpmlv37.apps.googleusercontent.com"
                    buttonText="Login With Google"
                    onSuccess={responseGoogle}
                    cookiePolicy={'single_host_origin'}
                    />
                </div>
            </form>
        </div>
    )
}

export default Login
