import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Article from './pages/Article.jsx'
import ArticleList from './pages/ArticleList.jsx'
import Term from './pages/Term.jsx'
import Author from './pages/Author.jsx'
import AllCategories from './pages/AllCategories.jsx'
import Search from './pages/Search.jsx'
import StaticPage from './pages/StaticPage.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:slug" element={<Article />} />
        <Route path="/all_articles/recent" element={<ArticleList variant="recent" />} />
        <Route path="/all_articles/edited" element={<ArticleList variant="edited" />} />
        <Route path="/all_articles/external" element={<ArticleList variant="external" />} />
        <Route path="/all_articles/a-z" element={<ArticleList variant="a_z" />} />
        <Route path="/all_categories" element={<AllCategories />} />
        <Route path="/type/:name" element={<Term kind="type" />} />
        <Route path="/country/:name" element={<Term kind="country" />} />
        <Route path="/source/:name" element={<Term kind="source" />} />
        <Route path="/author/:name" element={<Author />} />
        <Route path="/search" element={<Search />} />
        <Route path="/about" element={<StaticPage name="about" />} />
        <Route path="/contact" element={<StaticPage name="contact" />} />
        <Route path="/submit" element={<StaticPage name="submit" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
