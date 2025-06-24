import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Meet from './pages/Meet';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/meet/:roomId" element={<Meet />} />
      </Routes>
    </Router>
  );
};

export default App;
