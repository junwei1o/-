import { Route, Switch } from 'wouter';
import Layout from './components/Layout';
import Home from './pages/Home';
import IslandPage from './pages/IslandPage';
import QuizPage from './pages/QuizPage';
import RecordsPage from './pages/RecordsPage';
import StagesPage from './pages/StagesPage';

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/records" component={RecordsPage} />
        <Route path="/island/:subject/:grade">
          {(params) => <StagesPage subject={params.subject} grade={Number(params.grade)} />}
        </Route>
        <Route path="/island/:subject">
          {(params) => <IslandPage subject={params.subject} />}
        </Route>
        <Route path="/quiz/:subject/:grade/:stage">
          {(params) => (
            <QuizPage
              subject={params.subject}
              grade={Number(params.grade)}
              stage={Number(params.stage)}
            />
          )}
        </Route>
        {/* 找不到的路徑回首頁 */}
        <Route component={Home} />
      </Switch>
    </Layout>
  );
}
