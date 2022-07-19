import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { BiTime } from 'react-icons/bi';

import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    const totalHeadingWords = contentItem.heading.split(' ').length;

    const totalBodyWords = contentItem.body.reduce((totalBody, bodyRow) => {
      return totalBody + bodyRow.text.split(' ').length;
    }, 0);

    return total + totalHeadingWords + totalBodyWords;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  return (
    <div className={styles.container}>
      <header>
        <img src={post.data.banner.url} alt="banner" />

        <h1>{post.data.title}</h1>
        <footer>
          <div>
            <FiCalendar />
            <p>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </p>
          </div>

          <div>
            <FiUser />
            <p>{post.data.author}</p>
          </div>

          <div>
            <BiTime />
            <p>{readTime} min</p>
          </div>
        </footer>
      </header>

      {post.data.content.map(content => (
        <article key={content.heading}>
          <h1>{content.heading}</h1>

          <main
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: RichText.asHtml(content.body),
            }}
          />
        </article>
      ))}
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts');

  const paths = postsResponse.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
        uid: response.uid,
        data: {
          title: response.data.title,
          subtitle: response.data.subtitle,
          author: response.data.author,
          banner: response.data.banner,
          content: response.data.content.map(content => {
            return {
              heading: content.heading,
              body: [...content.body],
            };
          }),
        },
      },
    },
  };
};
