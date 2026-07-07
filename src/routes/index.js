import React, { Suspense, lazy } from 'react';
import { Switch, Route as PublicRoute } from 'react-router-dom';
import Route from './Route';
import APRs from '../pages/APRs';

const SignIn = lazy(() => import('../pages/SignIn'));
const FirstLoginChangePassword = lazy(() => import('../pages/FirstLoginChangePassword'));

const Profile = lazy(() => import('../pages/Profile'));
const New = lazy(() => import('../pages/New'));
const PreNew = lazy(() => import('../pages/PreNew'));
const New_Site = lazy(() => import('../pages/New_Site'));
const Open = lazy(() => import('../pages/Open'));
const ProfileADM = lazy(() => import('../pages/ProfileADM'));
const Assignments = lazy(() => import('../pages/Assignments'));
const Reports = lazy(() => import('../pages/Reports'));
const QuestionsPage = lazy(() => import('../pages/Questionarios/Question'));
const Sites = lazy(() => import('../pages/Sites/index'));
const Manager = lazy(() => import('../pages/ManagerUsers/index'));
const LogManager = lazy(() => import('../pages/LogManager/index'));
const InsertQuestions = lazy(() => import('../components/Question/InserQuestion'));
const UploadJsonToFirestore = lazy(() => import('../components/Email/uploadEmail'));
const ContactEmail = lazy(() => import('../pages/ContactEmail/index'));
const Patrimonio = lazy(() => import('../pages/Patrimonio'));
const ChecklistGemini = lazy(() => import('../pages/New_IA/ChecklistGemini'));
const Oem = lazy(() => import('../pages/Oem'));
const AnalyticsMap = lazy(() => import('../pages/AnalyticsMap'));
const VenezaSupplement = lazy(() => import('../pages/VenezaSupplement'));
const ANALYTICS_MAP_ALLOWED_UIDS = ['zbLnqdRrhIQSf7a3Wg4fMe32EFJ2'];

function RouteLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b21a8',
        fontWeight: 800,
      }}
    >
      Carregando APR Digital...
    </div>
  );
}

export default function Routes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        {/* paginas geral */}
        <Route exact path="/" component={SignIn} />
        <PublicRoute exact path="/veneza/suplementacao" component={VenezaSupplement} />
        <Route exact path="/validation" component={FirstLoginChangePassword} isPrivate />
        <Route exact path="/profile" component={Profile} isPrivate />
        <Route exact path="/profileadm" component={ProfileADM} isPrivate isAdm />
        <Route exact path="/new_site" component={New_Site} isPrivate isAdm />
        <Route exact path="/reports" component={Reports} isPrivate />
        <Route
          exact
          path="/analytics-map"
          component={AnalyticsMap}
          isPrivate
          allowedUids={ANALYTICS_MAP_ALLOWED_UIDS}
        />
        <Route exact path="/patrimonio" component={Patrimonio} isPrivate />
        <Route exact path="/oem" component={Oem} isPrivate/>
        <Route exact path="/sites" component={Sites} isPrivate />
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
        <Route exact path="/contact-email" component={ContactEmail} isPrivate/>

        <Route exact path="/checklist-ia" component={ChecklistGemini} isPrivate isAdm/>
      </Switch>
    </Suspense>
  );
}
