import { Switch } from 'react-router-dom';
import Route from './Route';

import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';

import Dashboard from '../pages/Dashboard';
import DashboardRondas from '../pages/Dashboard_Rondas';
import Profile from '../pages/Profile';
import New from '../pages/New';
import PreNew from '../pages/PreNew';
import New_Site from '../pages/New_Site';
import Open from '../pages/Open';
import ProfileADM from '../pages/ProfileADM';
import Assignments from '../pages/Assignments';
import NewRonda from '../pages/New_Ronda';
import Reports from '../pages/Reports';

export default function Routes() {
  return (
    <Switch>
      {/* paginas geral */}
      <Route exact path="/" component={SignIn} />
      <Route exact path="/register" component={SignUp} isPrivate isAdm />
      <Route exact path="/profile" component={Profile} isPrivate />
      <Route exact path="/profileadm" component={ProfileADM} isPrivate isAdm />
      <Route exact path="/new_site" component={New_Site} isPrivate isAdm />
      <Route exact path="/reports" component={Reports} isPrivate />
      {/* paginas apr digital */}
      <Route exact path="/dashboard" component={Dashboard} isPrivate />
      <Route exact path="/new" component={PreNew} isPrivate />
      <Route exact path="/new/:id" component={New} isPrivate />
      <Route exact path="/new/:id/:id_assign" component={New} isPrivate />
      <Route exact path="/open/:id" component={Open} isPrivate /> {/*em teste*/}
      <Route exact path="/assignments" component={Assignments} isPrivate />
      {/* paginas ronda digital */}
      <Route
        exact
        path="/dashboardrondas"
        component={DashboardRondas}
        isPrivate
      />
      <Route exact path="/newronda" component={NewRonda} isPrivate />
    </Switch>
  );
}
