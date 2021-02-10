import React from "react";
import { v1 as uuid } from "uuid";
import UsernameGenerator from "username-generator";

const CreateRoom = (props) => {
    function create() {
        const id = UsernameGenerator.generateUsername("-");
        props.history.push(`/room/${id}`);
    }

    return (
        <button onClick={create}>Create Room</button>
    );
}

export default CreateRoom;