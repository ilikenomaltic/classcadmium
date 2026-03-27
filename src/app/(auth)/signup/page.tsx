import Link from 'next/link'
import { BeakerIcon } from '@heroicons/react/24/solid'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3">
            <BeakerIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Classcadmium</h1>
          <p className="text-gray-500 text-sm mt-1">화학 암기, 더 쉽게</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 text-center">회원가입</h2>

          {[
            { label: '이름',     id: 'name',     type: 'text' },
            { label: '이메일',   id: 'email',    type: 'email' },
            { label: '비밀번호', id: 'password', type: 'password' },
          ].map(({ label, id, type }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                id={id}
                type={type}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <div className="flex gap-3">
              {['학생', '선생님'].map((role) => (
                <button
                  key={role}
                  disabled
                  className="flex-1 py-2.5 rounded-full border-2 border-gray-200 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-full opacity-50 cursor-not-allowed text-sm"
          >
            가입하기 (준비 중)
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
