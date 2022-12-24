export const isDev = () => process.env.NODE_ENV === 'development'
export const Dev = ({children}) => {
    return isDev() ? children : <></>
}
export const getDocsLink = () => process.env.REACT_APP_DOCS_LINK;
