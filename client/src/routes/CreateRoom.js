import React from 'react';
import UsernameGenerator from 'username-generator';
import pio from '../assets/chikk.png';

const CreateRoom = (props) => {
  function create() {
    const id = UsernameGenerator.generateUsername('-');
    props.history.push(`/room/${id}`);
  }

  return (
    <div className="Create">
      <img src={pio} />
      <h2> PIO Video Chat</h2>
      <button className="newRoombtn" onClick={create}>Create Room</button>
    </div>
  );
};

export default CreateRoom;
