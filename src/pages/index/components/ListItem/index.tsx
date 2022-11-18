import React from 'react';

interface propsInterface {
    value?: string | number
}


function ListItem(props: propsInterface) {
    return (
        <li>{props.value}</li>
    );
}

export default ListItem