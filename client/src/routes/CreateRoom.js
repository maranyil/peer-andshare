import React from 'react';
import UsernameGenerator from 'username-generator';

const CreateRoom = (props) => {
  function create() {
    const id = UsernameGenerator.generateUsername('-');
    props.history.push(`/room/${id}`);
  }

  return (
    <div className="Create">
      <h2>PIO Video Chat</h2>  
      <button onClick={create}>Create Room</button>
    </div>
  );
};

export default CreateRoom;
