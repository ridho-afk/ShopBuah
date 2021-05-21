import React from 'react'
import './loading.css'
import PacmanLoader from "react-spinners/PacmanLoader";

function Loading() {
    return (
        <div className="load-page">
              <PacmanLoader color={'#0c1ea8'} size={50} />
        </div>
    )
}

export default Loading
