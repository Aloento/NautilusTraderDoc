import { Redirect } from '@docusaurus/router';
import React from 'react';

export default function Home(): React.JSX.Element {
    return <Redirect to="/getting_started/" />;
}
