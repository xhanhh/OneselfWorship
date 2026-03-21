import relativeTime from "dayjs/plugin/relativeTime"
import 'dayjs/locale/zh-cn'
import dayjs from "dayjs";

dayjs.extend(relativeTime);
dayjs.locale('zh-cn')

export function useTime() {

    function formatDate(date: string) {
        return dayjs(date).format('YYYY年MM月DD日')
    }

    function formatDateTime(date: string) {
        return dayjs(date).format('YYYY年MM月DD日 HH:mm')
    }

    function fromNow(date: string) {
        return dayjs(date).fromNow()
    }

    function getCurrentYear() {
        return dayjs().year()
    }

    return {
        formatDate,
        formatDateTime,
        fromNow,
        getCurrentYear
    }

}
