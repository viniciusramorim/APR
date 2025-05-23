import { Switch } from 'react-router-dom';
import Route from './Route';

import SignIn from '../pages/SignIn';

import APRs from '../pages/APRs';
import Profile from '../pages/Profile';
import New from '../pages/New';
import PreNew from '../pages/PreNew';
import New_Site from '../pages/New_Site';
import Open from '../pages/Open';
import ProfileADM from '../pages/ProfileADM';
import Assignments from '../pages/Assignments';
import Reports from '../pages/Reports';
import QuestionsPage from '../pages/Questionarios/Question';
import Sites from '../pages/Sites/index';
import Manager from '../pages/ManagerUsers/index';
import LogManager from '../pages/LogManager/index';
import InsertQuestions from '../components/Question/InserQuestion';
import UploadJsonToFirestore from '../components/Email/uploadEmail';
import ContactEmail from '../pages/ContactEmail/index' 
import Patrimonio from '../pages/Patrimonio';

export default function Routes() {
  return (
    <Switch>
      {/* paginas geral */}
      <Route exact path="/" component={SignIn} />
      <Route exact path="/profile" component={Profile} isPrivate />
      <Route exact path="/profileadm" component={ProfileADM} isPrivate isAdm />
      <Route exact path="/new_site" component={New_Site} isPrivate isAdm />
      <Route exact path="/reports" component={Reports} isPrivate />
      <Route exact path="/patrimonio" component={Patrimonio} isPrivate />
      <Route exact path="/sites" component={Sites} isPrivate isAdm />
      <Route exact path="/manager-users" component={Manager} isPrivate isAdm />
      <Route exact path="/manager-logs" component={LogManager} isPrivate isAdm />
      {/* paginas apr digital */}
      <Route exact path="/aprs" component={APRs} isPrivate />
      <Route exact path="/questions" component={QuestionsPage} isPrivate isAdm/>
      <Route exact path="/insert" component={InsertQuestions} isPrivate isAdm/>
      <Route exact path="/new" component={PreNew} isPrivate />
      <Route exact path="/new/:id" component={New} isPrivate />
      <Route exact path="/new/:id/:id_assign" component={New} isPrivate />
      <Route exact path="/open/:id" component={Open} isPrivate />
      <Route exact path="/assignments" component={Assignments} isPrivate />
      <Route exact path="/upload-email" component={UploadJsonToFirestore} isPrivate />
      <Route exact path="/contact-email" component={ContactEmail} isPrivate isAdm/>
    </Switch>
  );
}
