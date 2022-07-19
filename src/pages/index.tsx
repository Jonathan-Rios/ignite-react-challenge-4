import { GetStaticProps } from 'next';
import { useState } from 'react';
import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;

  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  const handleNextPage = async (): Promise<void> => {
    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );
    setNextPage(postsResults.next_page);
    console.log(`-posts------------`, posts);
    console.log(`-postsResults.results------------`, postsResults.results);
    setPosts([...posts, ...postsResults.results]);
  };

  return (
    <div className={styles.container}>
      {posts.map(post => (
        <Link key={post.uid} href={`post/${post.uid}`}>
          <div className={styles.post}>
            <h1>{post.data.title}</h1>
            <p>{post.data.subtitle}</p>
            <footer>
              <div>
                <FiCalendar />
                <p>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </p>
              </div>

              <div>
                <FiUser />
                <p>{post.data.author}</p>
              </div>
            </footer>
          </div>
        </Link>
      ))}

      {nextPage && (
        <div className={styles.footer}>
          <button
            className={styles.button}
            type="button"
            onClick={handleNextPage}
          >
            Carregar mais posts
          </button>
        </div>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 1,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: { postsPagination },
    revalidate: 1800,
  };
};
